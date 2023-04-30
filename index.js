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
        
        x1 = Math.max(min_position, Math.min(x1, max_x));
        y1 = Math.max(min_position, Math.min(y1, max_y));
        x2 = Math.max(min_position, Math.min(x2, max_x));
        y2 = Math.max(min_position, Math.min(y2, max_y));
        const intersected_x1 = (constant - (y1 * y_coefficient)) / x_coefficient;
        const intersected_y1 = (constant - (x1 * x_coefficient)) / y_coefficient;
        const intersected_x2 = (constant - (y2 * y_coefficient)) / x_coefficient;
        const intersected_y2 = (constant - (x2 * x_coefficient)) / y_coefficient;

        (isBetween(intersected_y1, min_position, max_y)) ? y1 = intersected_y1 : x1 = intersected_x1;
        (isBetween(intersected_y2, min_position, max_y)) ? y2 = intersected_y2 : x2 = intersected_x2;


        // Stops early if line doesn't intersect canvas.
        if (!isBetween(x1, min_position, max_x) ||
            !isBetween(y1, min_position, max_y) ||
            !isBetween(x2, min_position, max_x) ||
            !isBetween(y2, min_position, max_y))
        { return; }


        // Creates the separations
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
            if (Math.abs(line_dx) <= 0.5 && isBetween(current_x, x1, x2))
            {
                const col = current_x + ((line_dx < 0) ? 0 : 1);
                this.addNewLineMinimum(this.rows[current_y], col);
            }

            if (Math.abs(line_dy) <= 0.5 && isBetween(current_y, y1, y2))
            {
                const row = current_y + ((line_dy < 0) ? 0 : 1);
                this.addNewLineMinimum(this.cols[current_x], row);
            }


            // Determines the next pixel to move to.
            const x_direction = (x1 < x2) ? 1 : -1;
            const y_direction = (y1 < y2) ? 1 : -1;
            const x_wall = current_x + (0.5 * x_direction);
            const y_wall = current_y + (0.5 * y_direction);
            const y_intersection = (constant - (x_wall * x_coefficient)) / y_coefficient;
            const x_intersection = (constant - (y_wall * y_coefficient)) / x_coefficient;

            if (Math.abs(current_x - x_intersection) <= 0.5) current_y += y_direction;
            else if (Math.abs(current_y - y_intersection) <= 0.5) current_x += x_direction;
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
}