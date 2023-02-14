
/**
 * CompornentPropsTypeof<typeiof function>で、コンポーネントの型を抽出する。
 */
export type CompornentPropsTypeof<T> = T extends (arg1: infer R, ...args: any) => any ? R : never;