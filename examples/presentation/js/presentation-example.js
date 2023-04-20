let screenMaterial;
let prevButton;
let nextButton;

let currentSlide = 0;
const slides = [];

world.onload = () => {
  const screenNode = world.findNodeByName("PresentationScreen");
  screenMaterial = screenNode.mesh.primitives[0].material;

  for (let i = 0; i < 7; i++) {
    const slideMaterial = world.findMaterialByName(`Slide${i + 1}`);
    const slideTexture = slideMaterial.baseColorTexture;
    slides.push(slideTexture);
  }

  prevButton = world.findNodeByName("PrevButton");
  prevButton.addInteractable();
  nextButton = world.findNodeByName("NextButton");
  nextButton.addInteractable();
};

world.onupdate = (dt) => {
  if (nextButton.interactable.pressed) {
    currentSlide = (currentSlide + 1) % slides.length;
    screenMaterial.baseColorTexture = slides[currentSlide];
  }

  if (prevButton.interactable.pressed) {
    currentSlide = currentSlide - 1;

    if (currentSlide < 0) {
      currentSlide = slides.length - 1;
    }

    screenMaterial.baseColorTexture = slides[currentSlide];
  }
};
