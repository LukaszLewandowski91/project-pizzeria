import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';

class HomePage {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
  }

  render(element) {
    const thisHome = this;

    const generateHTML = templates.homePage();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;

    thisHome.dom.wrapper.innerHTML = generateHTML;
  }
}

export default HomePage;
