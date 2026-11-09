const rule = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: { forbidden: "Comments are not allowed in this codebase." },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          context.report({ loc: comment.loc, messageId: "forbidden" });
        }
      },
    };
  },
};

const plugin = { rules: { "no-comments": rule } };

export default plugin;
