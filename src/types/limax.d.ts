declare module 'limax' {
  type Options =
    | {
        custom?: string[] | { [key: string]: string };
        lang?: string;
        maintainCase?: boolean;
        replacement?: string;
        separator?: string;
        separateNumbers?: boolean;
        separateApostrophes?: boolean;
        tone?: boolean;
      }
    | string;

  function slugify(text: string, opt?: Options): string;

  export default slugify;
}
