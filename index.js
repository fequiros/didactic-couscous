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


class ConnectedLines
{
    constructor()
    {
        // Creates arrays at each row and column that will store the separations
        // between pixels within that line.
        this.rows = new Array(canvas_height).fill([]);
        this.cols = new Array(canvas_width).fill([]);
    }
}