import 'katex/dist/katex.min.css';

/**
 * dynamically loads and renders katex equations within a given container element.
 * 
 * this function looks for maths expressions using the $$...$$ and $...$ delimiters.
 * it uses katex's auto-render functionality and aligns with the delimiters used in latexToHtml.js,
 * where both inline and display maths is wrapped in $$...$$.
 * 
 * @param {HTMLElement} containerElement - DOM element to render KaTeX inside
 */
export async function renderLatexInContainer(containerElement) {
  if (!containerElement) return;

  try {
    const { default: renderMathInElement } = await import('katex/contrib/auto-render');
    renderMathInElement(containerElement, {
      delimiters: [
        { left: "$$", right: "$$", display: false }
      ],
      throwOnError: false,
      strict: true,
      errorCallback: (msg, err) => {
        console.warn("KaTeX render error:", msg, err);
      }
    });
  } catch (err) {
    console.error("Failed to dynamically load KaTeX renderer:", err);
  }
}