export default defineContentScript({
  matches: ['https://github.com/trending*'],
  main() {
    console.log('Trendslate content script injected');
  },
});
