// Canvas width input
let canvas_width_input = document.getElementById("canvas-width-input");
canvas_width_input.addEventListener("input", (event) => {
    canvas_width_input.value = Math.max(0, Math.min(parseInt(canvas_width_input.value), 4096));
});

// Canvas height input
let canvas_height_input = document.getElementById("canvas-height-input");
canvas_height_input.addEventListener("input", (event) => {
    canvas_height_input.value = Math.max(0, Math.min(parseInt(canvas_height_input.value), 4096));
});

// Randomize design input
let randomize_design_input = document.getElementById("randomize-design-input");
randomize_design_input.onclick = randomizeDesign;

let change_color_pattern_input = document.getElementById("change-color-pattern-input");
change_color_pattern_input.onclick = randomizeSectionColors;

// Number of colors input
let number_of_colors_input = document.getElementById("number-of-colors-input");
number_of_colors_input.addEventListener("input", (event) => {
    number_of_colors_input.value = Math.max(1, Math.min(parseInt(number_of_colors_input.value), 32));
});

let sections = [];
let colors = [];

// Randomize colors input
let randomize_colors_input = document.getElementById("randomize-colors-input");
randomize_colors_input.onclick = randomizeColors;
randomizeColors();


function randomizeColors()
{
    let color_list_element = document.getElementById("color-list");
    let next_colors = [];
    const number_of_colors = parseInt(number_of_colors_input.value);
    for (let i = 0; i != number_of_colors; ++i)
    {
        next_colors.push(randomRGB());
    }
    colors = next_colors;

    
    while (color_list_element.firstChild)
    {
        color_list_element.removeChild(color_list_element.lastChild);
    }

    for (let i = 0; i != number_of_colors; ++i)
    {
        let new_list_element = document.createElement("li");
        let new_color_element = document.createElement("input");
        new_color_element.type = "color";
        new_color_element.value = rgbToHex(colors[i][0], colors[i][1], colors[i][2]);
        new_color_element.color_index = i;
        new_color_element.addEventListener("input", (event) => {
            let color = colors[event.target.color_index];
            let rgb = hexToRgb(event.target.value);
            color[0] = rgb.r;
            color[1] = rgb.g;
            color[2] = rgb.b;
            drawSectionsToCanvas();
        });
        new_list_element.appendChild(new_color_element);
        color_list_element.appendChild(new_list_element);
    }

    randomizeSectionColors();
}

// Copied these from: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  // End copied
  

function drawSectionsToCanvas()
{
    // Draw sections to image_data
    let canvas_context = document.getElementById("canvas").getContext("2d");
    const x_symmetric = document.getElementById("left-right-symmetric-input").checked;
    const y_symmetric = document.getElementById("up-down-symmetric-input").checked;
    const design_width = (x_symmetric) ? Math.ceil(canvas_context.canvas.width / 2) : canvas_context.canvas.width;
    const design_height = (y_symmetric) ? Math.ceil(canvas_context.canvas.height / 2) : canvas_context.canvas.height;

    let canvas_data = new ImageData(design_width, design_height);
    for (let i = 0; i != sections.length; ++i)
    {
        sections[i].setColor(canvas_data, colors[sections[i].color_index]);
    }


    // Draw image_data to canvas based on symmetries
    canvas_context.putImageData(canvas_data, 0, 0);

    const next_x = Math.floor(canvas_context.canvas.width / 2);
    const next_y = Math.floor(canvas_context.canvas.height / 2);
    if (x_symmetric && y_symmetric)
    {
        mirrorImageData(canvas_data, true, false);
        canvas_context.putImageData(canvas_data, next_x, 0);
        mirrorImageData(canvas_data, false, true);
        canvas_context.putImageData(canvas_data, next_x, next_y);
        mirrorImageData(canvas_data, true, false);
        canvas_context.putImageData(canvas_data, 0, next_y);
    }
    else if (x_symmetric)
    {
        mirrorImageData(canvas_data, true, false);
        canvas_context.putImageData(canvas_data, next_x, 0);
    }
    else if (y_symmetric)
    {
        mirrorImageData(canvas_data, false, true);
        canvas_context.putImageData(canvas_data, 0, next_y);
    }

    // Smooth image
    canvas_data = canvas_context.getImageData(0, 0, canvas_context.canvas.width, canvas_context.canvas.height);
    canvas_context.putImageData(smoothImageData(canvas_data), 0, 0);
}

function randomizeSectionColors()
{
    for (let i = 0; i != sections.length; ++i)
    {
        sections[i].color_index = Math.floor(Math.random() * colors.length);
    }

    drawSectionsToCanvas();
}

function randomizeDesign()
{
    // Update canvas width and height from html input elements
    let canvas_context = document.getElementById("canvas").getContext("2d");
    const canvas_width = parseInt(canvas_width_input.value);
    const canvas_height = parseInt(canvas_height_input.value);
    canvas_context.canvas.width = canvas_width;
    canvas_context.canvas.height = canvas_height;


    // Determine design dimensions based on symmetries and canvas dimensions
    const x_symmetric = document.getElementById("left-right-symmetric-input").checked;
    const y_symmetric = document.getElementById("up-down-symmetric-input").checked;
    const design_width = (x_symmetric) ? Math.ceil(canvas_width / 2) : canvas_width;
    const design_height = (y_symmetric) ? Math.ceil(canvas_height / 2) : canvas_height;


    // Generate the design
    let connected_lines = new Boundaries(design_width, design_height);
    let design_complexity = parseInt(document.getElementById("complexity-input").value);
    design_complexity /= 100;
    design_complexity *= design_complexity;
    const min_shapes = 3 + (Math.round(47 * design_complexity) * ((!x_symmetric) ? 1.5 : 1) * ((!y_symmetric) ? 1.5 : 1));
    const max_shapes = 3 + (Math.round(47 * design_complexity) * ((!x_symmetric) ? 1.5 : 1) * ((!y_symmetric) ? 1.5 : 1));
    //const shapes = Math.floor(min_shapes + Math.random() * (max_shapes - min_shapes));
    let shapes = 1;
    connected_lines.addShapes(shapes);

    
    // Find and store the sections for changing colors later
    sections = connected_lines.createSections();

    randomizeSectionColors();
}

function mirrorImageData(image_data, horizontal, vertical)
{
    if (horizontal)
    {
        for (let y = 0; y != image_data.height; ++y)
        {
            for (let x = 0; x < Math.floor(image_data.width / 2); ++x)
            {
                const rgba_copy = getPixel(image_data, image_data.width - x - 1, y);
                setPixel(image_data, image_data.width - x - 1, y, getPixel(image_data, x, y));
                setPixel(image_data, x, y, rgba_copy);
            }
        }
    }

    if (vertical)
    {
        for (let x = 0; x != image_data.width; ++x)
        {
            for (let y = 0; y < Math.floor(image_data.height / 2); ++y)
            {
                const rgba_copy = getPixel(image_data, x, image_data.height - y - 1);
                setPixel(image_data, x, image_data.height - y - 1, getPixel(image_data, x, y));
                setPixel(image_data, x, y, rgba_copy);
            }
        }
    }
}

function smoothImageData(image_data)
{
    let smoothed_image_data = new ImageData(image_data.width, image_data.height);
    for (let y = 0; y != image_data.height; ++y)
    {
        for (let x = 0; x != image_data.width; ++x)
        {
            let around_colors = [];

            // this pixel
            around_colors.push(getPixel(image_data, x, y));

            // upper three pixels
            if (y > 0)
            {
                around_colors.push(getPixel(image_data, x, y - 1));
                if (x > 0) around_colors.push(getPixel(image_data, x - 1, y - 1));
                if (x < image_data.width - 1) around_colors.push(getPixel(image_data, x + 1, y - 1));
            }

            // lower three pixels
            if (y < image_data.height - 1)
            {
                around_colors.push(getPixel(image_data, x, y + 1));
                if (x > 0) around_colors.push(getPixel(image_data, x - 1, y + 1));
                if (x < image_data.width - 1) around_colors.push(getPixel(image_data, x + 1, y + 1));
            }

            // left pixel
            if (x > 0) around_colors.push(getPixel(image_data, x - 1, y));

            // right pixel
            if (x < image_data.width - 1) around_colors.push(getPixel(image_data, x + 1, y));

            
            // average around pixels
            let sum_rgb = [0, 0, 0, 255];
            let around_colors_length = around_colors.length;
            for (let i = 0; i != around_colors_length; ++i)
            {
                let weight = 1.0 / around_colors_length;
                weight *= ((i == 0) ? around_colors_length * 0.75 : (around_colors_length * 0.25) / (around_colors_length - 1));
                sum_rgb[0] += around_colors[i][0] * weight;
                sum_rgb[1] += around_colors[i][1] * weight;
                sum_rgb[2] += around_colors[i][2] * weight;
            }
            sum_rgb[0] = Math.round(sum_rgb[0]);
            sum_rgb[1] = Math.round(sum_rgb[1]);
            sum_rgb[2] = Math.round(sum_rgb[2]);
            

            // add averaged pixel to smoothed image data
            setPixel(smoothed_image_data, x, y, sum_rgb);
        }
    }
    return smoothed_image_data;
}

function randomRGB()
{
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    let a = 255;
    return [r, g, b, a];
}

function getPixel(image_data, x, y)
{
    const index = 4 * ((y * image_data.width) + x);
    r = image_data.data[index + 0];
    g = image_data.data[index + 1];
    b = image_data.data[index + 2];
    a = image_data.data[index + 3];
    return [r,g,b,a];
}

function setPixel(image_data, x, y, rgba)
{
    const index = 4 * ((y * image_data.width) + x);
    image_data.data[index + 0] = rgba[0];
    image_data.data[index + 1] = rgba[1];
    image_data.data[index + 2] = rgba[2];
    image_data.data[index + 3] = rgba[3];
}

function isBetween(check, a, b)
{
    if (a < b)
    {
        if (a <= check && check <= b) return true;
    }
    else
    {
        if (b <= check && check <= a) return true;
    }

    return false;
}

class Boundaries
{
    constructor(width, height)
    {
        this.width = width;
        this.height = height;

        this.rows = [];
        for (let i = 0; i != height; ++i) this.rows.push([[0, width - 1]]);

        this.cols = [];
        for (let i = 0; i != width; ++i) this.cols.push([[0, height - 1]]);
    }

    // Adds a new minimum bound at the position in the provided row/col
    addNewMinimumBound(line, position)
    {
        for (let i = 0; i != line.length; ++i)
        {
            const min = line[i][0];
            const max = line[i][1];
            if (min < position && position <= max)
            {
                line.splice(i + 1, 0, [position, max]);
                line[i][1] = position - 1;
                return;
            }
        }
    }

    // Creates separations on the line between (x1, y1) and (x2, y2).
    addLine(x1, y1, x2, y2)
    {
        // constant = (x * x_coefficient) + (y * y_coefficient)
        const x_coefficient = -(y2 - y1);
        const y_coefficient = (x2 - x1);
        const constant = (x1 * x_coefficient) + (y1 * y_coefficient);


        // If possible, clamps (x1, y1) and (x2, y2) to be inside the canvas.
        const min_position = -0.49;
        const max_x = this.width - 0.51;
        const max_y = this.height - 0.51;
        
        if (Math.abs(x1 - x2) < 0.0000001 && !isBetween(x1, min_position, max_x)) return;
        if (Math.abs(y1 - y2) < 0.0000001 && !isBetween(y1, min_position, max_y)) return;
        
        x1 = Math.max(min_position, Math.min(x1, max_x));
        y1 = Math.max(min_position, Math.min(y1, max_y));
        x2 = Math.max(min_position, Math.min(x2, max_x));
        y2 = Math.max(min_position, Math.min(y2, max_y));
        if (Math.abs(x1 - x2) > 0.0000001 && Math.abs(y1 - y2) > 0.0000001)
        {
            const intersected_x1 = (constant - (y1 * y_coefficient)) / x_coefficient;
            const intersected_y1 = (constant - (x1 * x_coefficient)) / y_coefficient;
            const intersected_x2 = (constant - (y2 * y_coefficient)) / x_coefficient;
            const intersected_y2 = (constant - (x2 * x_coefficient)) / y_coefficient;

            (isBetween(intersected_y1, min_position, max_y)) ? y1 = intersected_y1 : x1 = intersected_x1;
            (isBetween(intersected_y2, min_position, max_y)) ? y2 = intersected_y2 : x2 = intersected_x2;
        }

        // Stops early if line doesn't intersect canvas.
        if (!isBetween(x1, min_position, max_x) ||
            !isBetween(y1, min_position, max_y) ||
            !isBetween(x2, min_position, max_x) ||
            !isBetween(y2, min_position, max_y))
        { return; }


        // Creates the separations
        const x_direction = (x1 < x2) ? 1 : -1;
        const y_direction = (y1 < y2) ? 1 : -1;
        const start_x = Math.round(x1);
        const start_y = Math.round(y1);
        const end_x = Math.round(x2);
        const end_y = Math.round(y2);
        let current_x = start_x;
        let current_y = start_y;
        while (isBetween(current_x, start_x, end_x) && isBetween(current_y, start_y, end_y))
        {
            // Get deltas from the center of pixel to line.
            const line_dx = ((constant - (current_y * y_coefficient)) / x_coefficient) - current_x;
            const line_dy = ((constant - (current_x * x_coefficient)) / y_coefficient) - current_y;


            // Creates separations at current position based on deltas.
            if (Math.abs(x_coefficient) < 0.0000001)
            {
                const row = current_y + ((current_y > y1) ? 0 : 1);
                this.addNewMinimumBound(this.cols[current_x], row);
            }
            else if (Math.abs(y_coefficient) < 0.0000001)
            {
                const col = current_x + ((current_x > x1) ? 0 : 1);
                this.addNewMinimumBound(this.rows[current_y], col);
            }
            else
            {
                if (Math.abs(line_dx) < 0.0000001)
                {
                    const col = current_x + ((x_direction < 0) ? 0 : 1);
                    const row = current_y + ((y_direction > 0) ? 0 : 1);
                    this.addNewMinimumBound(this.rows[current_y], col);
                    this.addNewMinimumBound(this.cols[current_x], row);
                }
                else
                {
                    if (isBetween(current_y, y1, y2) && Math.abs(line_dx) <= 0.5)
                    {
                        const col = current_x + ((line_dx < 0) ? 0 : 1);
                        this.addNewMinimumBound(this.rows[current_y], col);
                    }
                    if (isBetween(current_x, x1, x2) && Math.abs(line_dy) <= 0.5)
                    {
                        const row = current_y + ((line_dy < 0) ? 0 : 1);
                        this.addNewMinimumBound(this.cols[current_x], row);
                    }
                }
            }
            

            // Determines the next pixel to move to.
            const x_wall = current_x + (0.5 * x_direction);
            const y_wall = current_y + (0.5 * y_direction);
            const y_intersection = (constant - (x_wall * x_coefficient)) / y_coefficient;
            const x_intersection = (constant - (y_wall * y_coefficient)) / x_coefficient;

            if (Math.abs(x1 - x2) < 0.0000001)
            {
                current_y += y_direction;
            }
            else if (Math.abs(y1 - y2) < 0.0000001)
            {
                current_x += x_direction;
            }
            else
            {
                if (Math.abs(current_x - x_intersection) <= 0.5) current_y += y_direction;
                else if (Math.abs(current_y - y_intersection) <= 0.5) current_x += x_direction;
            }
        }
    }

    // Creates shapes and uses their edges to update bounds
    addShapes(number_of_shapes)
    {
        for (let i = 0; i != number_of_shapes; ++i)
        {
            const shape = new StretchedRegularPolygon(this.width, this.height);
            const number_of_vertices = shape.vertices.length;
            for (let n = 1; n <= number_of_vertices; ++n)
            {
                const prior_vertex = shape.vertices[n - 1];
                const vertex = shape.vertices[n % number_of_vertices];
                const x1 = prior_vertex[0];
                const y1 = prior_vertex[1];
                const x2 = vertex[0];
                const y2 = vertex[1];
                this.addLine(x1, y1, x2, y2);
            }
        }
    }

    addConnectedLinesToSection(section, prior_row, prior_line, row, index)
    {
        // Finds the columns over which the two rows "overlap"
        const next_line = this.rows[row][index];
        let overlap_min = Math.max(prior_line[0], next_line[0]);
        let overlap_max = Math.min(prior_line[1], next_line[1]);

        // Checks if the two rows are connected within one of those columns
        let are_connected = false;
        for (let c = overlap_min; c <= overlap_max; ++c)
        {
            for (let i = 0; i != this.cols[c].length; ++i)
            {
                const min_row = this.cols[c][i][0];
                const max_row = this.cols[c][i][1];
                if (isBetween(prior_row, min_row, max_row) && isBetween(row, min_row, max_row))
                {
                    section.addConnectedRow(row, next_line);
                    this.rows[row].splice(index, 1);
                    c = overlap_max + 1;
                    are_connected = true;
                    break;
                }
            }
        }

        
        // The rows aren't connected so don't look for further connections.
        if (!are_connected) { return false; }


        // Check if rows below are connected
        if (row < this.height - 1)
        {
            for (let i = 0; i != this.rows[row + 1].length; ++i)
            {
                if (this.addConnectedLinesToSection(section, row, next_line, row + 1, i))
                {
                    i = -1;
                }
            }
        }
        

        // Check if rows above are connected
        if (row > 0)
        {
            for (let i = 0; i != this.rows[row - 1].length; ++i)
            {
                if (this.addConnectedLinesToSection(section, row, next_line, row - 1, i))
                {
                    i = -1;
                }
            }
        }

        return true;
    }

    createSections()
    {
        let sections = [];
        let current_row = 0;
        while (current_row < this.height)
        {
            if (this.rows[current_row].length == 0) current_row += 1;
            else
            {
                let next_section = new Section(current_row);
                this.addConnectedLinesToSection(next_section, current_row, [0, this.width - 1], current_row, 0);
                sections.push(next_section);
            }
        }

        return sections;
    }
}

function randFloat(min, max)
{
    return min + (Math.random() * (max - min));
}

function randInt(min, max)
{
    return Math.floor(randFloat(min, max + 1));
}

class StretchedRegularPolygon
{
    constructor(boundaries_width, boundaries_height)
    {
        const min_x = -0.49;
        const max_x = boundaries_width - 0.51;
        const min_y = -0.49;
        const max_y = boundaries_height - 0.51;
        const center_x = randFloat(min_x, max_x);
        const center_y = randFloat(min_y, max_y);

        const min_radius = 4;
        const max_radius = Math.hypot(max_x - min_x, max_y - min_y) * 0.25;
        const radius = randFloat(min_radius, max_radius);

        const min_sides = 3;
        const max_sides = 20;
        const sides = randInt(min_sides, max_sides);

        const orientation = randFloat(0, 2 * Math.PI);
        const stretch_axis = randFloat(0, 2 * Math.PI);
        const stretch_scale = randFloat(0.05, 1.0);

        this.createShape(center_x, center_y, radius, sides, orientation, stretch_axis, stretch_scale);
    }

    createShape(center_x, center_y, radius, sides, orientation, stretch_axis, stretch_scale)
    {
        this.vertices = [];

        const internal_angle = (2 * Math.PI) / sides;
        for (let i = 0; i != sides; ++i)
        {
            // Get initial unstretched and untranslated vertex
            const vertex_direction = orientation + (i * internal_angle);
            const initial_vertex_x = radius * Math.cos(vertex_direction);
            const initial_vertex_y = radius * Math.sin(vertex_direction);

            // Project it to the stretch axis
            const projection_distance = radius * Math.cos(stretch_axis - vertex_direction);
            const projected_x = Math.cos(stretch_axis) * projection_distance;
            const projected_y = Math.sin(stretch_axis) * projection_distance;

            // Get the vector from the projected point to the initial vertex
            const difference_x = initial_vertex_x - projected_x;
            const difference_y = initial_vertex_y - projected_y;

            // The stretched vertex is on some proportion of that line
            const vertex_x = projected_x + (stretch_scale * difference_x);
            const vertex_y = projected_y + (stretch_scale * difference_y);
            this.vertices.push([center_x + vertex_x, center_y + vertex_y]);
        }
    }
}

class Section
{
    constructor(initial_y)
    {
        this.initial_y = initial_y;
        this.rows = [];
    }

    addConnectedRow(y, connected_row)
    {
        const row_index = y - this.initial_y;
        if (row_index >= this.rows.length)
        {
            this.rows.push([connected_row]);
        }
        else
        {
            this.rows[row_index].push(connected_row);
        }
    }

    setColor(image_data, rgba)
    {
        for (let row = 0; row != this.rows.length; ++row)
        {
            for (let i = 0; i != this.rows[row].length; ++i)
            {
                for (let col = this.rows[row][i][0]; col <= this.rows[row][i][1]; ++col)
                {
                    setPixel(image_data, col, this.initial_y + row, rgba);
                }
            }
        }
    }
}