const presentationScreen = WebSG.getNodeByName("PresentationScreen");
const prevButton = WebSG.getNodeByName("PrevButton");
prevButton.interactable = new WebSG.Interactable();
const nextButton = WebSG.getNodeByName("NextButton");
nextButton.interactable = new WebSG.Interactable();

let currentSlide = 0;

const slides = [];

for (let i = 0; i < 7; i++) {
  slides.push(WebSG.getMaterialByName(`Slide${i + 1}`).baseColorTexture);
}

onupdate = (dt) => {
  if (nextButton.interactable.pressed) {
    currentSlide = (currentSlide + 1) % slides.length;

    for (const primitive of presentationScreen.mesh.primitives()) {
      primitive.material.baseColorTexture = slides[currentSlide];
    }
  }

  if (prevButton.interactable.pressed) {
    currentSlide = currentSlide - 1;

    if (currentSlide < 0) {
      currentSlide = slides.length - 1;
    }

    for (const primitive of presentationScreen.mesh.primitives()) {
      primitive.material.baseColorTexture = slides[currentSlide];
    }
  }
};
