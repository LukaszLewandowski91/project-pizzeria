/* eslint-disable */
class Carousel {
  constructor(element) {
    const thisCarousel = this;

    thisCarousel.render(element);
    thisCarousel.initPlugin();
  }
  render(element) {
    const thisCarousel = this;
    thisCarousel.wrapper = element;
  }
  initPlugin() {
    const thisCarousel = this;

    var flkty = new Flickity(thisCarousel.wrapper, {
      autoPlay: true,
    });
  }
}

export default Carousel;
