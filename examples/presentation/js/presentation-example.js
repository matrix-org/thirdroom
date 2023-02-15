let screenMaterial;
let prevButton;
let nextButton;

let currentSlide = 0;
const slides = [];

onload = () => {
  const screenNode = WebSG.nodeFindByName("PresentationScreen");
  const screenMesh = WebSG.nodeGetMesh(screenNode);
  screenMaterial = WebSG.meshGetPrimitiveMaterial(screenMesh, 0);

  for (let i = 0; i < 7; i++) {
    const slideMaterial = WebSG.materialFindByName(`Slide${i + 1}`);
    const slideTexture = WebSG.materialGetBaseColorTexture(slideMaterial);
    slides.push(slideTexture);
  }

  prevButton = WebSG.nodeFindByName("PrevButton");
  WebSG.addInteractable(prevButton);
  nextButton = WebSG.nodeFindByName("NextButton");
  WebSG.addInteractable(nextButton);
};

onupdate = (dt) => {
  if (WebSG.getInteractablePressed(nextButton)) {
    currentSlide = (currentSlide + 1) % slides.length;

    WebSG.materialSetBaseColorTexture(screenMaterial, slides[currentSlide]);
  }

  if (WebSG.getInteractablePressed(prevButton)) {
    currentSlide = currentSlide - 1;

    if (currentSlide < 0) {
      currentSlide = slides.length - 1;
    }

    WebSG.materialSetBaseColorTexture(screenMaterial, slides[currentSlide]);
  }
};
