// src/types/vite-env.d.ts
declare module "*.js?url" {
  const src: string;
  export default src;
}
