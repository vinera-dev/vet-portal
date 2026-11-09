import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/typeDefs.ts",
  documents: ["src/graphql/operations/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "schema.graphql": {
      plugins: ["schema-ast"],
    },
    "src/gql/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-resolvers",
        "typed-document-node",
      ],
      config: {
        enumsAsTypes: true,
        useTypeImports: true,
        contextType: "@/graphql/context#GraphqlContext",
        scalars: { Date: "string", LocalDateTime: "string" },
      },
    },
  },
};

export default config;
