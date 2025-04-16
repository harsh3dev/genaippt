function generateRecipe() {
    const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const userInput = document.getElementById("userIngredients").value;
    const cuisine = document.getElementById("cuisine").value;
    const mealType = document.getElementById("mealType").value;
    const cookingTime = document.getElementById("cookingTime").value;
    const complexity = document.getElementById("complexity").value;
  
    const allIngredients = [...selected, ...userInput.split(',').map(i => i.trim()).filter(Boolean)];
  
    const query = new URLSearchParams({
      ingredients: allIngredients.join(", "),
      cuisine,
      mealType,
      cookingTime,
      complexity
    });
  
    const container = document.getElementById("recipeResult");
    const downloadBtn = document.getElementById("downloadBtn");
  
    container.style.display = "block";
    downloadBtn.style.display = "none"; // hide until recipe finishes
  
    container.innerHTML = "<h2>Generating recipe...</h2>";
  
    const eventSource = new EventSource(`https://genaippt.onrender.com/recipeStream?${query.toString()}`);
  
    let recipeContent = "";
  
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === "start") {
        recipeContent = "";
      } else if (data.action === "chunk") {
        const chunk = data.chunk.trim();
        if (/^(##|[*-]|[0-9]+\.)/.test(chunk) || chunk === "") {
          recipeContent += `\n${chunk}\n`;
        } else {
          recipeContent += ` ${chunk}`;
        }
  
        container.innerHTML = `
          <h2>Generated Recipe</h2>
          <div class="markdown" id="pdfContent">${marked.parse(recipeContent)}</div>
        `;
      } else if (data.action === "close") {
        eventSource.close();
        downloadBtn.style.display = "inline-block"; // show PNG download
      }
    };
  
    eventSource.onerror = () => {
      eventSource.close();
      container.innerHTML = `<p style="color:red;">Error while fetching recipe. Please try again later.</p>`;
      downloadBtn.style.display = "none";
    };
  }
  
  // PNG generation
  document.getElementById("downloadBtn").addEventListener("click", () => {
    const element = document.getElementById("pdfContent");
    html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true }).then(canvas => {
        const link = document.createElement("a");
        link.download = `Vegan_Recipe_${new Date().toISOString().split("T")[0]}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
  });
