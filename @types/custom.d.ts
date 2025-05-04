declare module "*.svg" {
  const content: any;
  export default content;
}
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";

declare module "*.graphql" {
  import { DocumentNode } from "graphql";
  const doc: DocumentNode;
  export default doc;
}
declare module "*.gql" {
  import { DocumentNode } from "graphql";
  const doc: DocumentNode;
  export default doc;
}