import { Ng302Page } from './app.po';

describe('ng302 App', () => {
  let page: Ng302Page;

  beforeEach(() => {
    page = new Ng302Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
