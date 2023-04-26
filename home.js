const canvas_width = 400;
const canvas_height = 400;


var canvas_element = document.getElementById("canvas");
var canvas_context = canvas_element.getContext("2d");
canvas_context.canvas.width = canvas_width;
canvas_context.canvas.height = canvas_height;
var canvas_data = new ImageData(canvas_width, canvas_height);

document.getElementById("generate-button").onclick = generate;


function setPixel(x, y, r, g, b, a)
{
    let index = 4 * ((y * canvas_width) + x)
    canvas_data[index + 0] = r;
    canvas_data[index + 1] = g;
    canvas_data[index + 2] = b;
    canvas_data[index + 3] = a;
}


function addShape(center_x, center_y, radius, sides, orientation, stretch_axis, stretch_scale)
{
    var vertices = [];
    let angle_separation = (2 * Math.PI) / sides;
    for (let i = 0; i != sides; ++i)
    {
        let direction = orientation + (i * angle_separation);
        let vertex_x = center_x + (Math.cos(direction) * radius);
        let vertex_y = center_y + (Math.sin(direction) * radius);

        let theta = stretch_axis - direction;
        let d = Math.cos(theta) * radius;
        let stretch_x = center_x + Math.cos(stretch_axis) * d;
        let stretch_y = center_y + Math.sin(stretch_axis) * d;

        let stretch_direction = Math.atan2(vertex_y - stretch_y, vertex_x - stretch_x);
        let stretch_distance = stretch_scale * Math.hypot(vertex_y - stretch_y, vertex_x - stretch_x);
        let stretched_vertex_x = stretch_x + (Math.cos(stretch_direction) * stretch_distance);
        let stretched_vertex_y = stretch_y + (Math.sin(stretch_direction) * stretch_distance);

        vertices.push([stretched_vertex_x, stretched_vertex_y]);
    }


    canvas_context.moveTo(vertices[0][0], vertices[0][1]);
    for (let i = 0; i != vertices.length - 1; ++i)
    {
        canvas_context.lineTo(vertices[i+1][0], vertices[i+1][1]);
    }
    canvas_context.lineTo(vertices[0][0], vertices[0][1]);
    canvas_context.stroke();
}

function generate()
{
    let min_pos_x = 50;
    let min_pos_y = 50;
    let max_pos_x = 350;
    let max_pos_y = 350;
    let min_radius = 10;
    let max_radius = 400;
    let min_sides = 3;
    let max_sides = 20;

    let min_shapes = 5;
    let max_shapes = 15;

    canvas_context.clearRect(0, 0, canvas_width, canvas_height);
    canvas_context.beginPath();
    
    let number_of_shapes = Math.floor(min_shapes + (Math.random() * (max_shapes - min_shapes)));
    for (let i = 0; i != number_of_shapes; ++i)
    {
        let pos_x = min_pos_x + (Math.random() * (max_pos_x - min_pos_x));
        let pos_y = min_pos_y + (Math.random() * (max_pos_y - min_pos_y));
        let radius = min_radius + (Math.random() * (max_radius - min_radius));
        let sides = Math.floor(min_sides + (Math.random() * (max_sides - min_sides)));
        let orientation = Math.random() * 2 * Math.PI;
        let stretch_axis = Math.random() * 2 * Math.PI;
        let stretch_scale = 0.1 + (Math.random() * 0.9);
        addShape(pos_x, pos_y, radius, sides, orientation, stretch_axis, stretch_scale);
    }
}