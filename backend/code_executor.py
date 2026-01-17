import asyncio
import os
import json
import httpx
import structlog
from typing import Optional, AsyncGenerator

logger = structlog.get_logger()

class CodeExecutor:
    """
    Управляет выполнением команд внутри Docker-контейнера песочницы.
    """
    def __init__(self, container_name: str = "algo-sandbox"):
        self.container_name = container_name

    async def execute_command(self, command: str, cwd: str = "/home/sandbox/app") -> AsyncGenerator[str, None]:
        """
        Выполняет команду через docker exec и возвращает потоковый вывод.
        """
        # Формируем команду docker exec
        # -w задает рабочую директорию
        docker_cmd = [
            "docker", "exec",
            "-w", cwd,
            self.container_name,
            "bash", "-c", command
        ]
        
        logger.info("executing_sandbox_command", command=command, container=self.container_name)

        process = await asyncio.create_subprocess_exec(
            *docker_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )

        if process.stdout:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                yield line.decode("utf-8")

        await process.wait()
        logger.info("sandbox_command_finished", exit_code=process.returncode)

    async def run_tests(self, problem_path: str) -> dict:
        """
        Запускает pytest для конкретной задачи и возвращает результаты в формате JSON.
        """
        # Мы предполагаем, что файлы задачи уже смонтированы или скопированы в контейнер
        
        command = "pytest --json-report --json-report-file=/tmp/report.json test.py && cat /tmp/report.json"
        
        # Внутренний путь в контейнере
        container_cwd = f"/home/sandbox/app/{os.path.basename(problem_path)}"
        
        output = ""
        async for line in self.execute_command(command, cwd=container_cwd):
            # Мы ищем JSON вывод в конце
            if line.startswith('{"created"'):
                output = line
            elif output: # Если уже начали собирать JSON
                output += line

        try:
            return json.loads(output)
        except json.JSONDecodeError:
            logger.error("failed_to_parse_pytest_json", output=output[:100])
            return {"error": "Failed to parse test results"}

    async def process_xp_award(self, user_id: str, test_results: dict, user_service_url: str):
        """
        Парсит результаты тестов и начисляет XP через User Service.
        """
        if "error" in test_results:
            return
            
        summary = test_results.get("summary", {})
        passed_count = summary.get("passed", 0)
        total_count = summary.get("total", 0)
        
        if total_count == 0:
            return

        # Логика: 10 XP за каждый тест + 200 XP если пройдены ВСЕ тесты
        xp_to_add = passed_count * 10
        if passed_count == total_count and total_count > 0:
            xp_to_add += 200
            
        if xp_to_add > 0:
            logger.info("awarding_xp", user_id=user_id, amount=xp_to_add, passed=passed_count, total=total_count)
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{user_service_url}/profile/{user_id}/add_xp",
                        json={"amount": xp_to_add},
                        timeout=5.0
                    )
            except Exception as e:
                logger.error("xp_award_failed", error=str(e))

code_executor = CodeExecutor()