export const onDocumentReady = (action:Function) => {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded', (event) => {
        action();
      }, 
      false,
    );
    return;
  }
  action();
};
