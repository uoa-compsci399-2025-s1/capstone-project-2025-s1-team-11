import 'katex/dist/katex.min.css';

/**
 * dynamically loads and renders katex equations within a given container.
 * 
 * this function looks for maths expressions using the $$...$$ and $...$ delimiters.
 * it uses katex's auto-render functionality and aligns with the delimiters used in latexToHtml.js,
 * where both inline and display maths is wrapped in $$...$$.
 * 
 * @param {string} containerSelector - css selector to locate the container (e.g. '.preview-container')
 */
export async function renderLatexInContainer(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  try {
    // wait for dom to be ready before rendering
    const { default: renderMathInElement } = await import('katex/contrib/auto-render');
    renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false,
      errorCallback: (msg, err) => {
        console.warn("KaTeX render error:", msg, err);
      }
    });
  } catch (err) {
    // failed to dynamically load katex renderer
    console.error("Failed to dynamically load KaTeX renderer:", err);
  }
}