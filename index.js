const canvas_width = 800;
const canvas_height = 800;

let canvas_context = document.getElementById("canvas").getContext("2d");
canvas_context.canvas.width = canvas_width;
canvas_context.canvas.height = canvas_height;
let canvas_data;

let generate_button = document.getElementById("generate-button");
generate_button.onclick = generate;


function generate()
{
    canvas_data = new ImageData(canvas_width, canvas_height);

    let connected_lines = new ConnectedLines();
    connected_lines.addShape(400, 400, 100, 8, 0, 0.1, 1.0);

    let sections = connected_lines.createSections();
    for (let i = 0; i != sections.length; ++i)
    {
        sections[i].setColor(randomRGB());
    }

    canvas_context.putImageData(canvas_data, 0, 0);
}


function randomRGB()
{
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    let a = 255;
    return [r, g, b, a];
}

function setPixel(x, y, rgba)
{
    let index = 4 * ((y * canvas_width) + x)
    canvas_data.data[index + 0] = rgba[0];
    canvas_data.data[index + 1] = rgba[1];
    canvas_data.data[index + 2] = rgba[2];
    canvas_data.data[index + 3] = rgba[3];
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

class ConnectedLines
{
    constructor()
    {
        // Creates arrays at each row and column that store the separations
        // between pixels on that line.
        this.rows = [];
        for (let i = 0; i != canvas_height; ++i)
        {
            this.rows.push([[0, canvas_width - 1]]);
        }

        this.cols = [];
        for (let i = 0; i != canvas_width; ++i)
        {
            this.cols.push([[0, canvas_height - 1]]);
        }
    }

    // Creates separation with position as the minimum
    addNewLineMinimum(line, position)
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
        const max_x = canvas_width - 0.51;
        const max_y = canvas_height - 0.51;
        
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
                this.addNewLineMinimum(this.cols[current_x], row);
            }
            else if (Math.abs(y_coefficient) < 0.0000001)
            {
                const col = current_x + ((current_x > x1) ? 0 : 1);
                this.addNewLineMinimum(this.rows[current_y], col);
            }
            else
            {
                if (Math.abs(line_dx) < 0.0000001)
                {
                    const col = current_x + ((x_direction < 0) ? 0 : 1);
                    const row = current_y + ((y_direction > 0) ? 0 : 1);
                    this.addNewLineMinimum(this.rows[current_y], col);
                    this.addNewLineMinimum(this.cols[current_x], row);
                }
                else
                {
                    if (isBetween(current_y, y1, y2) && Math.abs(line_dx) <= 0.5)
                    {
                        const col = current_x + ((line_dx < 0) ? 0 : 1);
                        this.addNewLineMinimum(this.rows[current_y], col);
                    }
                    if (isBetween(current_x, x1, x2) && Math.abs(line_dy) <= 0.5)
                    {
                        const row = current_y + ((line_dy < 0) ? 0 : 1);
                        this.addNewLineMinimum(this.cols[current_x], row);
                    }
                }
            }
            

            // Determines the next pixel to move to.
            const x_wall = current_x + (0.5 * x_direction);
            const y_wall = current_y + (0.5 * y_direction);
            const y_intersection = (constant - (x_wall * x_coefficient)) / y_coefficient;
            const x_intersection = (constant - (y_wall * y_coefficient)) / x_coefficient;

            if (Math.abs(current_x - x_intersection) <= 0.5) current_y += y_direction;
            else if (Math.abs(current_y - y_intersection) <= 0.5) current_x += x_direction;
        }
    }

    // Creates separations along the border of a stretched regular polygon
    addShape(center_x, center_y, radius, sides, orientation, stretch_axis, stretch_scale)
    {
        let vertices = [];
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

        for (let i = 1; i != vertices.length; ++i)
        {
            this.addLine(vertices[i-1][0], vertices[i-1][1], vertices[i][0], vertices[i][1]);
        }
        this.addLine(vertices[vertices.length-1][0], vertices[vertices.length-1][1], vertices[0][0], vertices[0][1]);
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
        if (row < canvas_height - 1)
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
        while (current_row < canvas_height)
        {
            if (this.rows[current_row].length == 0) current_row += 1;
            else
            {
                let next_section = new Section(current_row);
                this.addConnectedLinesToSection(next_section, current_row, [0, canvas_width - 1], current_row, 0);
                sections.push(next_section);
            }
        }

        return sections;
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

    setColor(rgba)
    {
        for (let row = 0; row != this.rows.length; ++row)
        {
            for (let i = 0; i != this.rows[row].length; ++i)
            {
                for (let col = this.rows[row][i][0]; col <= this.rows[row][i][1]; ++col)
                {
                    setPixel(col, this.initial_y + row, rgba);
                }
            }
        }
    }
}