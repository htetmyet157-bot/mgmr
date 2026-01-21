const loader = document.getElementById("loader-backdrop");

loader.addEventListener("click", () => {
  loader.classList.add("exit");
  setTimeout(() => {
    loader.remove();
  }, 600); // match CSS transition duration
});