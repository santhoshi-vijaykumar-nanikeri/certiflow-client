declare module 'html-docx-js' {
    const htmlDocx: {
      asBlob: (html: string) => Blob;
    };
    export = htmlDocx;
  }