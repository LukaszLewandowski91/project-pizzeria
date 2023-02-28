import { classNames, select, templates } from '../settings.js';
import Carousel from './Carousel.js';

class HomePage {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initCarousel(select.containerOf.carousel);
  }

  render(element) {
    const thisHome = this;

    const generateHTML = templates.homePage();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;

    thisHome.dom.wrapper.innerHTML = generateHTML;

    thisHome.pages = document.querySelector(select.containerOf.pages).children;
    thisHome.navbar = document.querySelectorAll(select.nav.links);
    thisHome.homeLinks = document.querySelectorAll(select.nav.homeLinks);

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisHome.pages[0].id;

    for (let page of thisHome.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }

    thisHome.activatePage(pageMatchingHash);

    for (let link of thisHome.homeLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();

        const id = clickedElement.getAttribute('href').replace('#', '');
        thisHome.activatePage(id);

        window.location.hash = '#/' + id;
      });
    }
  }

  activatePage(pageId) {
    const thisHome = this;

    for (let page of thisHome.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    for (let navlink of thisHome.navbar) {
      navlink.classList.toggle(
        classNames.pages.active,
        navlink.getAttribute('href') == '#' + pageId
      );
    }

    for (let link of thisHome.homeLinks) {
      link.classList.toggle(
        classNames.pages.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  }

  initCarousel(element) {
    new Carousel(element);
  }
}

export default HomePage;
