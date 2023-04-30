const canvas_width = 800;
const canvas_height = 800;

let canvas_context = document.getElementById("canvas").getContext("2d");
canvas_context.canvas.width = canvas_width;
canvas_context.canvas.height = canvas_height;

let generate_button = document.getElementById("generate-button");
generate_button.onclick = generate;

function generate()
{
    
}