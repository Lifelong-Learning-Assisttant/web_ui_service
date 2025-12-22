"""
Конфигурация MathJax для рендеринга формул.
Этот скрипт можно импортировать и использовать в любом месте проекта.
"""

MATHJAX_CONFIG = r"""
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$','$$'], ['\\[','\\]']],
    processEscapes: true
  },
  startup: {
    // выключаем автоматический initial typeset — будем вызывать вручную после вставки контента
    typeset: false
  }
};
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
"""


def add_mathjax_support(ui):
    """
    Добавляет поддержку MathJax для рендеринга формул в интерфейсе.
    
    Args:
        ui: Экземпляр NiceGUI для добавления HTML в head.
    """
    ui.add_head_html(MATHJAX_CONFIG)


def render_mathjax():
    """
    Возвращает JavaScript для рендеринга формул MathJax.
    
    Returns:
        str: JavaScript код для вызова MathJax.typesetPromise().
    """
    return "if (window.MathJax) MathJax.typesetPromise();"