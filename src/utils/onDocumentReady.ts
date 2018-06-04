export default function onDocumentReady(action:Function) {
  if (document.readyState !== 'loading') {
    document.addEventListener(
      'onDOMContentLoaded', (event) => {
        action();
      }, 
      false,
    );
  }
  action();
}
