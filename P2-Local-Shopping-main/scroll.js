
const scrollContainer = document.getElementById('scrollContainer');
const scrollLeft = document.getElementById('scrollLeft');
const scrollRight = document.getElementById('scrollRight');


scrollLeft.addEventListener('click', () => {
  scrollContainer.scrollBy({ left: -100, behavior: 'smooth' });
});

scrollRight.addEventListener('click', () => {
  scrollContainer.scrollBy({ left: 100, behavior: 'smooth' });
  });