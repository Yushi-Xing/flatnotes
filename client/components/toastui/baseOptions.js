import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js";
import router from "../../router.js";

const customHTMLRenderer = {
  // 1. 标题：保留中文，作为 ID
  heading(node, { entering, getChildrenText, origin }) {
    const original = origin();
    if (entering) {
      const text = getChildrenText(node);
      original.attributes = {
        id: text
          .toLowerCase()
          // 允许中文、数字、字母、下划线、连字符，去掉其他符号
          .replace(/[^\p{L}\p{N}\-\s]+/gu, "") 
          .trim()
          .replace(/\s+/g, "-"),
      };
    }
    return original;
  },

  // 2. 链接：解码后再交给 Router，避免双重编码
  link(_, { entering, origin }) {
    const original = origin();
    if (entering) {
      let href = original.attributes.href;
      
      if (href.startsWith("#")) {
        // 先解码，抵消 Markdown 解析器的自动编码
        try {
          href = decodeURIComponent(href);
        } catch (e) {}

        const targetRoute = {
          ...router.currentRoute.value,
          hash: href,
        };
        
        // Router 会再次编码为标准 URL 格式，这次是单次编码，浏览器能识别
        original.attributes.href = router.resolve(targetRoute).href;
      }
    }
    return original;
  },
};

const baseOptions = {
  height: "100%",
  plugins: [codeSyntaxHighlight],
  customHTMLRenderer: customHTMLRenderer,
  usageStatistics: false,
};

export default baseOptions;
