const canvas_width = 400;
const canvas_height = 400;


var canvas_element = document.getElementById("canvas");
var canvas_context = canvas_element.getContext("2d");
canvas_context.canvas.width = canvas_width;
canvas_context.canvas.height = canvas_height;


document.getElementById("generate-button").onclick = generate;


function generate()
{
    var canvas_data = new ImageData(canvas_width, canvas_height);
    for (let y = 0; y != canvas_height; ++y)
    {
        for (let x = 0; x != canvas_width; ++x)
        {
            let r = Math.floor(Math.random() * 256);
            let g = Math.floor(Math.random() * 256);
            let b = Math.floor(Math.random() * 256);
            let a = 255;

            let index = 4 * ((y * canvas_width) + x)
            canvas_data.data[index + 0] = r;
            canvas_data.data[index + 1] = g;
            canvas_data.data[index + 2] = b;
            canvas_data.data[index + 3] = a;
        }
    }
    canvas_context.putImageData(canvas_data, 0, 0);
}