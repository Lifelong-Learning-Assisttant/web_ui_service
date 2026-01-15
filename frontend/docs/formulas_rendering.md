# Формулы LaTeX в NiceGUI 3.4.1

## Обзор

NiceGUI 3.4.1 поддерживает рендеринг LaTeX формул через `ui.markdown()` с параметром `extras=['latex']`.

## Установка зависимостей

```bash
uv add latex2mathml
```

## Поддерживаемые форматы

NiceGUI понимает следующие LaTeX форматы:

### 1. Строчные формулы
- **Формат**: `$...$` или `\(...\)`
- **Пример**: `$E=mc^2$` или `\(E=mc^2\)`
- **Результат**: формула встроенная в текст

### 2. Блочные формулы
- **Формат**: `$$...$$` или `\[...\]`
- **Пример**: 
  ```
  $$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$
  ```
- **Результат**: формула отдельной строкой, по центру

## Использование в коде

```python
from nicegui import ui

# Простой пример
ui.markdown('Формула $E=mc^2$ и блок $$\\frac{1}{n}$$', extras=['latex'])

# Пример с переменными
formula = r'$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$'
ui.markdown(f'Ошибка: {formula}', extras=['latex'])
```

## Парсер форматов

В нашем проекте используется парсер для обработки разных форматов от агента:

```python
import re

def convert_latex_for_nicegui(content: str) -> str:
    """Конвертирует LaTeX форматы в формат NiceGUI"""
    # Блочные формулы $$...$$ -> $$...$$
    content = re.sub(r'\$\$(.*?)\$\$', r'$$\1$$', content, flags=re.DOTALL)
    
    # Строчные \(...\) -> $...$
    content = re.sub(r'\\\\\\((.*?)\\\\\\)', r'$\1$', content)
    
    # Блочные \[...\] -> $$...$$
    content = re.sub(r'\\\\\\[(.*?)\\\\\\]', r'$$\1$$', content, flags=re.DOTALL)
    
    return content

# Использование
markdown_content = convert_latex_for_nicegui(agent_response)
ui.markdown(markdown_content, extras=['latex'])
```

## Поддерживаемые LaTeX конструкции

NiceGUI через `latex2mathml` поддерживает:

- **Простые формулы**: `x^2`, `y_i`, `\frac{a}{b}`
- **Суммы**: `\sum_{i=1}^{n}`, `\sum_{i=1}^{n} x_i`
- **Интегралы**: `\int_{a}^{b}`, `\int_{-\infty}^{\infty}`
- **Матрицы**: `\begin{bmatrix} a & b \\ c & d \end{bmatrix}`
- **Греческие буквы**: `\alpha`, `\beta`, `\gamma`
- **Специальные символы**: `\pm`, `\leq`, `\geq`, `\approx`

## Примеры

### Пример 1: Строчная формула
```python
ui.markdown(
    'Формула $E=mc^2$ была выведена Эйнштейном',
    extras=['latex']
)
```

### Пример 2: Блочная формула
```python
ui.markdown(
    '''
    Среднеквадратичная ошибка:
    $$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$
    ''',
    extras=['latex']
)
```

### Пример 3: Смешанный контент
```python
ui.markdown(
    '''
    Рассмотрим функцию $f(x) = x^2 + 2x + 1$.
    
    Ее производная:
    $$f'(x) = 2x + 2$$
    
    Это позволяет найти минимум при $x = -1$.
    ''',
    extras=['latex']
)
```

## Стилизация

Формулы автоматически стилизуются NiceGUI. В нашем проекте добавлены дополнительные стили:

```css
.math-formula {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.05);
}

.math-notation {
    font-family: 'Times New Roman', serif;
    font-style: italic;
    font-size: 16px;
    color: #F8F8F2;
}
```

## Ограничения

1. **Требуется интернет**: `latex2mathml` использует CDN для загрузки MathJax
2. **Производительность**: Сложные формулы могут замедлять рендеринг
3. **Поддержка браузеров**: MathML поддерживается всеми современными браузерами

## Альтернативы

Если нужна офлайн-рендеринг:
- **KaTeX**: Быстрее, но меньше поддержка конструкций
- **MathJax**: Полная поддержка, но тяжелее
- **SVG**: Можно сгенерировать на сервере

## Рекомендации

1. **Для простых формул**: Используйте `$...$`
2. **Для сложных формул**: Используйте `$$...$$`
3. **Для смешанного контента**: Конвертируйте все форматы через парсер
4. **Для продакшена**: Кэшируйте рендеренные формулы

## Полезные ссылки

- [NiceGUI Documentation](https://nicegui.io/documentation/markdown)
- [LaTeX Tutorial](https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes)
- [MathJax Demo](https://www.mathjax.org/#demo)