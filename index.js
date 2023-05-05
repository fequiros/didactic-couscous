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

function almostEqual(a, b, epsilon = 0.000001)
{
    return (Math.abs(a - b) < epsilon) ? true : false;
}

function randFloat(min, max)
{
    return min + (Math.random() * (max - min));
}

function randInt(min, max)
{
    return Math.floor(randFloat(min, max + 1));
}

class CanvasData
{
    constructor(width, height)
    {
        this.imgdata = new ImageData(width, height);
    }

    drawPixel(x, y, rgb)
    {
        const index = 4 * ((y * this.imgdata.width) + x);
                        
        this.imgdata.data[index + 0] = rgb[0];
        this.imgdata.data[index + 1] = rgb[1];
        this.imgdata.data[index + 2] = rgb[2];
        this.imgdata.data[index + 3] = 255;
    }

    getPixel(x, y)
    {
        const index = 4 * ((y * this.imgdata.width) + x);
        const r = this.imgdata.data[index + 0];
        const g = this.imgdata.data[index + 1];
        const b = this.imgdata.data[index + 2];
        return [r, g, b];
    }

    mirrorHorizontal()
    {
        const max_y = this.imgdata.height - 1;
        const max_x = this.imgdata.width - 1;
        for (let y = 0; y <= max_y; ++y)
        {
            for (let x = 0; x < Math.ceil(max_x / 2); ++x)
            {
                const rgb = this.getPixel(max_x - x, y);
                this.drawPixel(max_x - x, y, this.getPixel(x, y));
                this.drawPixel(x, y, rgb);
            }
        }

        return this;
    }

    mirrorVertical()
    {
        const max_y = this.imgdata.height - 1;
        const max_x = this.imgdata.width - 1;
        for (let x = 0; x <= max_x; ++x)
        {
            for (let y = 0; y < Math.ceil(max_y / 2); ++y)
            {
                const rgb = this.getPixel(x, max_y - y);
                this.drawPixel(x, max_y - y, this.getPixel(x, y));
                this.drawPixel(x, y, rgb);
            }
        }

        return this;
    }

    // Adds another CanvasData to this one at position (offset_x, offset_y)
    addData(data, offset_x, offset_y)
    {
        const data_width = data.imgdata.width;
        const data_height = data.imgdata.height;
        for (let x = 0; x != data_width; ++x)
        {
            const current_x = offset_x + x;
            for (let y = 0; y != data_height; ++y)
            {
                const current_y = offset_y + y;
                this.drawPixel(current_x, current_y, data.getPixel(x, y));
            }
        }
    }
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

    // Adds the top/bottom and left/right bounds at a position
    addBoundsAtPosition(current_x, current_y, line)
    {
        // Stop early if current_x or current_y are out of bounds
        const min_row = 0;
        const max_row = this.height - 1;
        const min_col = 0;
        const max_col = this.width - 1;
        if (current_x < min_col || current_x > max_col) return;
        if (current_y < min_row || current_y > max_row) return;


        // Horizontal and vertical deltas from (curr_x, curr_y) to line
        const hd = line.xAtY(current_y) - current_x;
        const vd = line.yAtX(current_x) - current_y;

        let row_bound = current_y;
        let col_bound = current_x;
        if (almostEqual(hd, 0) && !line.isHorizontal() && !line.isVertical())
        {
            if (line.x1 < line.x2) col_bound += 1;
            if (line.y1 > line.y2) row_bound += 1;
        }
        else
        {
            if (hd > 0) col_bound += 1;
            if (vd > 0) row_bound += 1;
        }


        // Add the bounds if within pixel and line "blocks" pixel center
        if (Math.abs(hd) <= 0.5 && isBetween(current_y, line.y1, line.y2))
        {
            this.addNewMinimumBound(this.rows[current_y], col_bound);
        }

        if (Math.abs(vd) <= 0.5 && isBetween(current_x, line.x1, line.x2))
        {
            this.addNewMinimumBound(this.cols[current_x], row_bound);
        }

        
    }

    // Creates separations on the line between (x1, y1) and (x2, y2).
    addLine(line)
    {
        const start_x = Math.round(line.x1);
        const start_y = Math.round(line.y1);
        const end_x = Math.round(line.x2);
        const end_y = Math.round(line.y2);
        let current_x = start_x;
        let current_y = start_y;
        while (isBetween(current_x, start_x, end_x) && isBetween(current_y, start_y, end_y))
        {
            this.addBoundsAtPosition(current_x, current_y, line);
            

            // Determines the next pixel to move to.
            const border_x = current_x + ((line.x1 < line.x2) ? 0.5 : -0.5);
            const border_y = current_y + ((line.y1 < line.y2) ? 0.5 : -0.5);
            const deviation_x = Math.abs(line.xAtY(border_y) - current_x);
            const deviation_y = Math.abs(line.yAtX(border_x) - current_y);

            if (deviation_y <= 0.5) current_x += (line.x1 < line.x2) ? 1 : -1;
            else if (deviation_x <= 0.5) current_y += (line.y1 < line.y2) ? 1 : -1;
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
                this.addLine(new Line(x1, y1, x2, y2));
            }
        }
    }
}

class Pattern
{
    randomizeBoundaries()
    {
        // Update canvas width and height from html input elements
        let canvas_context = document.getElementById("canvas").getContext("2d");
        const cwi = document.getElementById("canvas-width-input");
        const chi = document.getElementById("canvas-height-input");
        const canvas_width = parseInt(cwi.value);
        const canvas_height = parseInt(chi.value);
        canvas_context.canvas.width = canvas_width;
        canvas_context.canvas.height = canvas_height;


        // Determine design dimensions based on symmetries and canvas dimensions
        const hs = document.getElementById("left-right-symmetric-input").checked;
        const vs = document.getElementById("up-down-symmetric-input").checked;
        const design_width = (hs) ? Math.ceil(canvas_width / 2) : canvas_width;
        const design_height = (vs) ? Math.ceil(canvas_height / 2) : canvas_height;


        // Generate the boundaries
        this.boundaries = new Boundaries(design_width, design_height);
        const shapes = parseInt(document.getElementById("complexity-input").value);
        this.boundaries.addShapes(shapes);


        // Update sections
        this.createSections();

        // Give new sections their colors
        this.recolor();
    }

    createSections()
    {
        this.sections = [];

        let current_row = 0;
        while (current_row < this.boundaries.height)
        {
            if (this.boundaries.rows[current_row].length == 0) current_row += 1;
            else
            {
                let next_section = new Section(current_row);
                this.addConnectedBoundsToSection(next_section, current_row, [0, this.boundaries.width - 1], current_row, 0);
                this.sections.push(next_section);
            }
        }
    }

    // Adds the bound at [row][index] to sections if it's connected to the prior
    // bound. Calls itself to check bounds above and below it.
    addConnectedBoundsToSection(section, prior_row, prior_line, row, index)
    {
        // Finds the columns over which the two rows "overlap"
        const next_line = this.boundaries.rows[row][index];
        let overlap_min = Math.max(prior_line[0], next_line[0]);
        let overlap_max = Math.min(prior_line[1], next_line[1]);


        // Checks if the two rows are connected within one of those columns
        let are_connected = false;
        for (let c = overlap_min; c <= overlap_max; ++c)
        {
            for (let i = 0; i != this.boundaries.cols[c].length; ++i)
            {
                const min_row = this.boundaries.cols[c][i][0];
                const max_row = this.boundaries.cols[c][i][1];
                if (isBetween(prior_row, min_row, max_row) && isBetween(row, min_row, max_row))
                {
                    section.addBound(row, next_line);
                    this.boundaries.rows[row].splice(index, 1);
                    c = overlap_max + 1;
                    are_connected = true;
                    break;
                }
            }
        }

        
        // The rows aren't connected so don't look for further connections.
        if (!are_connected) return false;


        // Check if rows below are connected
        if (row < this.boundaries.height - 1)
        {
            for (let i = 0; i != this.boundaries.rows[row + 1].length; ++i)
            {
                if (this.addConnectedBoundsToSection(section, row, next_line, row + 1, i))
                {
                    i = -1;
                }
            }
        }
        

        // Check if rows above are connected
        if (row > 0)
        {
            for (let i = 0; i != this.boundaries.rows[row - 1].length; ++i)
            {
                if (this.addConnectedBoundsToSection(section, row, next_line, row - 1, i))
                {
                    i = -1;
                }
            }
        }

        return true;
    }

    // Creates canvas_data from current settings and pushes to canvas
    updateCanvas()
    {
        this.canvas_data = new CanvasData(this.boundaries.width, this.boundaries.height);

        this.drawSections();

        this.smoothenCanvasData();

        this.symmetrizeCanvasData();

        let canvas_context = document.getElementById("canvas").getContext("2d");
        canvas_context.putImageData(this.canvas_data.imgdata, 0, 0);
    }
    
    // Draws sections to canvas_data
    drawSections()
    {
        const sections = this.sections.length;
        for (let s = 0; s != sections; ++s)
        {
            const section = this.sections[s];
            const section_color = this.colors[section.color_index].rgb;
            for (let r = 0; r != section.rows.length; ++r)
            {
                const bounds = section.rows[r].length;
                for (let b = 0; b != bounds; ++b)
                {
                    const bound = section.rows[r][b];
                    const min_col = bound[0];
                    const max_col = bound[1];
                    for (let c = min_col; c <= max_col; ++c)
                    {
                        const x = c;
                        const y = section.initial_y + r;
                        this.canvas_data.drawPixel(x, y, section_color);
                    }
                }
            }
        }
    }

    // TODO: change scaling to be less weight towards other pixels as image gets smaller
    smoothenCanvasData()
    {
        let smoothed_data = new CanvasData(this.boundaries.width, this.boundaries.height);

        const max_y = this.boundaries.height - 1;
        const max_x = this.boundaries.width - 1;
        for (let y = 0; y <= max_y; ++y)
        {
            for (let x = 0; x <= max_x; ++x)
            {
                let weighted_sum = [0, 0, 0];
                let scale_sum = 0;

                const iy = Math.max(y - 1, 0);
                const fy = Math.min(y + 1, max_y);
                for (let cy = iy; cy <= fy; ++cy)
                {
                    const ix = Math.max(x - 1, 0);
                    const fx = Math.min(x + 1, max_x);
                    for (let cx = ix; cx <= fx; ++cx)
                    {
                        const rgb = this.canvas_data.getPixel(cx, cy);
                        const dx = Math.abs(cx - x);
                        const dy = Math.abs(cy - y);
                        const scale = 1 / (dx + dy + 1);
                        
                        weighted_sum[0] += rgb[0] * scale;
                        weighted_sum[1] += rgb[1] * scale;
                        weighted_sum[2] += rgb[2] * scale;
                        scale_sum += scale;
                    }
                }

                weighted_sum[0] /= scale_sum;
                weighted_sum[1] /= scale_sum;
                weighted_sum[2] /= scale_sum;
                weighted_sum[0] = Math.round(weighted_sum[0]);
                weighted_sum[1] = Math.round(weighted_sum[1]);
                weighted_sum[2] = Math.round(weighted_sum[2]);
                smoothed_data.drawPixel(x, y, weighted_sum);
            }
        }

        this.canvas_data = smoothed_data;
    }

    // Mirrors canvas_data based on symmetry settings
    symmetrizeCanvasData()
    {
        let canvas_context = document.getElementById("canvas").getContext("2d");
        const canvas_width = canvas_context.canvas.width;
        const canvas_height = canvas_context.canvas.height;

        let symmetrized_data = new CanvasData(canvas_width, canvas_height);


        const hs = document.getElementById("left-right-symmetric-input").checked;
        const vs = document.getElementById("up-down-symmetric-input").checked;


        symmetrized_data.addData(this.canvas_data, 0, 0);

        const ox = Math.floor(canvas_width / 2);
        const oy = Math.floor(canvas_height / 2);
        if (hs && vs)
        {
            symmetrized_data.addData(this.canvas_data.mirrorHorizontal(), ox, 0);
            symmetrized_data.addData(this.canvas_data.mirrorVertical(), ox, oy);
            symmetrized_data.addData(this.canvas_data.mirrorHorizontal(), 0, oy);
        }
        else if (hs)
        {
            symmetrized_data.addData(this.canvas_data.mirrorHorizontal(), ox, 0);
        }
        else if (vs)
        {
            symmetrized_data.addData(this.canvas_data.mirrorVertical(), 0, oy);
        }

        this.canvas_data = symmetrized_data;
    }

    // Randomizes section color indices
    recolor()
    {
        const max_color_index = this.colors.length - 1;
        const number_of_sections = this.sections.length;
        for (let i = 0; i != number_of_sections; ++i)
        {
            this.sections[i].color_index = randInt(0, max_color_index);
        }

        this.updateCanvas();
    }

    // Randomizes the color set (but doesn't update canvas)
    randomizeColors()
    {
        this.colors = [];
        const noci = document.getElementById("number-of-colors-input");
        const number_of_colors = parseInt(noci.value);
        for (let i = 0; i != number_of_colors; ++i)
        {
            this.colors.push(new Color());
        }

       this.updateHTMLColors();
    }

    // Updates html elements to show new color set
    updateHTMLColors()
    {
        let color_list_element = document.getElementById("color-list");
        while (color_list_element.firstChild)
        {
            color_list_element.removeChild(color_list_element.lastChild);
        }
    
        for (let i = 0; i != this.colors.length; ++i)
        {
            let new_list_element = document.createElement("li");
            let new_color_element = document.createElement("input");
            new_color_element.type = "color";
            new_color_element.value = this.colors[i].hex;
            // new_color_element.color_index = i;
            // new_color_element.addEventListener("input", (event) => {
            //     let color = colors[event.target.color_index];
            //     let rgb = hexToRgb(event.target.value);
            //     color[0] = rgb.r;
            //     color[1] = rgb.g;
            //     color[2] = rgb.b;
            //     drawSectionsToCanvas();
            // });
            new_list_element.appendChild(new_color_element);
            color_list_element.appendChild(new_list_element);
        }
    }
}

class Color
{
    constructor(rgb = undefined, hex = undefined)
    {
        if (rgb != undefined) this.rgb = rgb;
        else this.rgb = [randInt(0, 255), randInt(0, 255), randInt(0, 255)];
        this.hex = Color.rgbToHex(this.rgb);

        if (hex != undefined)
        {
            this.hex = hex;
            this.rgb = Color.hexToRGB(this.hex);
        }
    }

    static rgbToHex(rgb)
    {
        const rstr = rgb[0].toString(16).padStart(2, "0");
        const gstr = rgb[1].toString(16).padStart(2, "0");
        const bstr = rgb[2].toString(16).padStart(2, "0");
        return "#" + rstr + gstr + bstr;
    }

    static hexToRGB(hex)
    {
        const r = parseInt(hex.substring(1, 2), 16);
        const g = parseInt(hex.substring(3, 4), 16);
        const b = parseInt(hex.substring(5, 6), 16);
        return [r, g, b];
    }
}

class Line
{
    constructor(x1, y1, x2, y2)
    {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        // Line equation: constant = (x * x_coefficient) + (y * y_coefficient)
        this.x_coefficient = -(y2 - y1);
        this.y_coefficient = (x2 - x1);
        this.constant = (x1 * this.x_coefficient) + (y1 * this.y_coefficient);
    }

    isVertical()
    {
        return almostEqual(this.y_coefficient, 0);
    }

    isHorizontal()
    {
        return almostEqual(this.x_coefficient, 0);
    }

    // The x value of the line at a particular y value
    xAtY(y)
    {
        if (this.isVertical()) return this.x1;
        if (this.isHorizontal()) return undefined;
        return (this.constant - (y * this.y_coefficient)) / this.x_coefficient;
    }

    // The y value of the line at a particular x value
    yAtX(x)
    {
        if (this.isVertical()) return undefined;
        if (this.isHorizontal()) return this.y1;
        return (this.constant - (x * this.x_coefficient)) / this.y_coefficient;
    }
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

    addBound(row, bound)
    {
        const row_index = row - this.initial_y;
        if (row_index >= this.rows.length)
        {
            this.rows.push([bound]);
        }
        else
        {
            this.rows[row_index].push(bound);
        }
    }
}



let pattern = new Pattern();


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
randomize_design_input.onclick = function() { pattern.randomizeBoundaries(); };

let change_color_pattern_input = document.getElementById("change-color-pattern-input");
change_color_pattern_input.onclick = function() { pattern.recolor(); };

// Number of colors input
let number_of_colors_input = document.getElementById("number-of-colors-input");
number_of_colors_input.addEventListener("input", (event) => {
    number_of_colors_input.value = Math.max(1, Math.min(parseInt(number_of_colors_input.value), 16));
});

// Randomize colors input
let randomize_colors_input = document.getElementById("randomize-colors-input");
randomize_colors_input.onclick = function() { pattern.randomizeColors(); };
pattern.randomizeColors();