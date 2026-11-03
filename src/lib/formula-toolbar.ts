/**
 * Mathematical symbol toolbar for the formula editor.
 * Each entry inserts a LaTeX snippet at the cursor; `$$` marks where the
 * cursor should land after insertion. Organized per the StudyOS spec:
 * basic ops, fractions/roots, algebra, calculus, statistics, linear algebra,
 * Greek letters, relations & logic, plus Operations Research templates.
 */
export type SymbolItem = { label: string; latex: string };
export type SymbolGroup = { key: string; label: string; items: SymbolItem[] };

const cur = "$$";

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    key: "basic",
    label: "Basic",
    items: [
      { label: "+", latex: "+" },
      { label: "−", latex: "-" },
      { label: "×", latex: "\\times" },
      { label: "÷", latex: "\\div" },
      { label: "=", latex: "=" },
      { label: "≠", latex: "\\neq" },
      { label: ">", latex: ">" },
      { label: "<", latex: "<" },
      { label: "±", latex: "\\pm" },
      { label: "·", latex: "\\cdot" },
    ],
  },
  {
    key: "fractions",
    label: "Fractions & Roots",
    items: [
      { label: "Fraction", latex: `\\frac{a}{b}` },
      { label: "√", latex: `\\sqrt{${cur}}` },
      { label: "∛", latex: `\\sqrt[3]{${cur}}` },
      { label: "nth root", latex: `\\sqrt[n]{${cur}}` },
    ],
  },
  {
    key: "algebra",
    label: "Algebra",
    items: [
      { label: "x²", latex: `x^{${cur}}` },
      { label: "x₁", latex: `x_{${cur}}` },
      { label: "( )", latex: `\\left(${cur}\\right)` },
      { label: "[ ]", latex: `\\left[${cur}\\right]` },
      { label: "|x|", latex: `\\left|${cur}\\right|` },
    ],
  },
  {
    key: "calculus",
    label: "Calculus",
    items: [
      { label: "Sum", latex: `\\sum_{i=1}^{n} ${cur}` },
      { label: "Integral", latex: `\\int_{a}^{b} f(x)\\,dx` },
      { label: "Limit", latex: `\\lim_{x \\to 0} ${cur}` },
      { label: "dy/dx", latex: `\\frac{dy}{dx}` },
      { label: "∂", latex: `\\frac{\\partial y}{\\partial x}` },
    ],
  },
  {
    key: "statistics",
    label: "Statistics",
    items: [
      { label: "Mean μ", latex: `\\mu = \\frac{\\sum x_i}{n}` },
      { label: "Variance", latex: `\\sigma^2 = \\frac{\\sum (x_i-\\mu)^2}{n}` },
      { label: "Std dev σ", latex: `\\sigma = \\sqrt{\\frac{\\sum (x_i-\\mu)^2}{n}}` },
      { label: "P(A|B)", latex: `P(A \\mid B)` },
      { label: "E(X)", latex: `E(X) = \\sum x_i\\,p_i` },
      { label: "∈ set", latex: `x \\in S` },
    ],
  },
  {
    key: "linalg",
    label: "Linear Algebra",
    items: [
      {
        label: "Matrix",
        latex: "\\begin{bmatrix}\n  a & b \\\\\n  c & d\n\\end{bmatrix}",
      },
      {
        label: "Determinant",
        latex: "\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}",
      },
      { label: "Vector", latex: `\\vec{v} = \\begin{bmatrix} ${cur} \\end{bmatrix}` },
      { label: "Dot product", latex: `\\vec{a} \\cdot \\vec{b}` },
      { label: "Ax=b", latex: `A\\vec{x} = \\vec{b}` },
    ],
  },
  {
    key: "greek",
    label: "Greek",
    items: [
      { label: "α", latex: "\\alpha" },
      { label: "β", latex: "\\beta" },
      { label: "γ", latex: "\\gamma" },
      { label: "δ", latex: "\\delta" },
      { label: "θ", latex: "\\theta" },
      { label: "λ", latex: "\\lambda" },
      { label: "μ", latex: "\\mu" },
      { label: "σ", latex: "\\sigma" },
      { label: "π", latex: "\\pi" },
      { label: "Ω", latex: "\\Omega" },
    ],
  },
  {
    key: "logic",
    label: "Relations & Logic",
    items: [
      { label: "≈", latex: "\\approx" },
      { label: "≡", latex: "\\equiv" },
      { label: "∞", latex: "\\infty" },
      { label: "∴", latex: "\\therefore" },
      { label: "∀", latex: "\\forall" },
      { label: "∃", latex: "\\exists" },
      { label: "∩", latex: "\\cap" },
      { label: "∪", latex: "\\cup" },
      { label: "≤", latex: "\\leq" },
      { label: "≥", latex: "\\geq" },
    ],
  },
  {
    key: "or",
    label: "Op. Research",
    items: [
      {
        label: "LP model",
        latex:
          "Z = 3x_1 + 5x_2 \\quad \\text{(maximize)} \\\\\n2x_1 + x_2 \\leq 10 \\\\\nx_1 + 3x_2 \\leq 12 \\\\\nx_1, x_2 \\geq 0",
      },
      { label: "Objective", latex: `\\text{Maximize } Z = ${cur}` },
      { label: "Subject to", latex: "\\text{subject to}" },
      { label: "Transport", latex: `\\min Z = \\sum_{i=1}^{m}\\sum_{j=1}^{n} c_{ij}x_{ij}` },
      { label: "Assignment", latex: `\\min Z = \\sum_{i=1}^{n}\\sum_{j=1}^{n} c_{ij}x_{ij}, \\quad x_{ij} \\in \\{0,1\\}` },
      { label: "EOQ", latex: `EOQ = \\sqrt{\\frac{2DC_o}{C_h}}` },
      { label: "M/M/1", latex: `L_s = \\frac{\\lambda}{\\mu - \\lambda}` },
      { label: "PERT tₑ", latex: `t_e = \\frac{t_o + 4t_m + t_p}{6}` },
    ],
  },
];
