import os
from PIL import Image

def resize_avatars():
    directory = "avatars"
    if not os.path.exists(directory):
        print(f"Директория '{directory}' не найдена.")
        return

    # Получаем список всех файлов изображений
    image_files = [f for f in os.listdir(directory) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif'))]
    
    if not image_files:
        print("В папке 'avatars' нет изображений.")
        return

    images = []
    min_width = float('inf')
    min_height = float('inf')

    # Шаг 1: Находим минимальный размер
    print("Анализ размеров изображений...")
    for filename in image_files:
        path = os.path.join(directory, filename)
        try:
            with Image.open(path) as img:
                width, height = img.size
                print(f"{filename}: {width}x{height}")
                if width < min_width:
                    min_width = width
                if height < min_height:
                    min_height = height
                images.append(path)
        except Exception as e:
            print(f"Ошибка при открытии {filename}: {e}")

    if not images:
        return

    target_size = (min_width, min_height)
    print(f"\nЦелевой размер: {min_width}x{min_height}")

    # Шаг 2: Изменяем размер всех изображений
    print("\nИзменение размеров...")
    for path in images:
        try:
            with Image.open(path) as img:
                # Используем Resampling.LANCZOS для высокого качества при уменьшении
                resized_img = img.resize(target_size, Image.Resampling.LANCZOS)
                resized_img.save(path)
                print(f"Обновлен: {os.path.basename(path)}")
        except Exception as e:
            print(f"Ошибка при обработке {path}: {e}")

    print("\nГотово!")

if __name__ == "__main__":
    resize_avatars()