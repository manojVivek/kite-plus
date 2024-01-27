export const stringToNode = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild as ChildNode;
};

export const onURLChange = (callback: () => void) => {
  // Improve this
  let lastURL = document.location.href;

  setInterval(() => {
    if (lastURL !== document.location.href) {
      callback();
      lastURL = document.location.href;
    }
  }, 1000);
};
