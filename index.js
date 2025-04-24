const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Folder paths
const TEMPLATE_DIR = path.join(__dirname, "templates");
const PREVIEW_DIR = path.join(__dirname, "previews");

// Generate Preview
app.get("/",(req,res)=>{
    res.render("form.ejs")
})

app.post("/generate-preview", async (req, res) => {

  const { templateId, business_name, description, showServices,showTestimonials,showAbout } = req.body;
  const templatePath = path.join(TEMPLATE_DIR, templateId);
  const previewId = Date.now().toString();
  const previewPath = path.join(PREVIEW_DIR, previewId);

  try {
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return res.status(400).json({ success: false, message: "Template not found" });
    }

    // Copy template to preview directory
    await fs.copy(templatePath, previewPath);

    // Replace placeholder in index.html
    const indexFile = path.join(previewPath, "index.html");
    let html = await fs.readFile(indexFile, "utf-8");

    const clientData = {
      business_name,
      description,
      showServices,showTestimonials,showAbout
    };

    html = html.replace("__CLIENT_DATA__", JSON.stringify(clientData).replace(/</g, "\\u003c"));
    await fs.writeFile(indexFile, html);

    // Return preview link
    res.json({
      success: true,
      previewLink: `https://test-production-8541.up.railway.app/preview/${previewId}`
    });

  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Serve generated previews
// app.use("/preview", express.static(PREVIEW_DIR));
app.use("/preview", express.static(path.join(__dirname, "previews")));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Preview server running at http://localhost:${PORT}`);
});
