const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

class PriorityQItem {
    constructor(value, priority) {
        this.value = value
        this.priority = priority
    }
}

class PriorityQ {
    constructor() {
        this.queue = []
    }

    add(priority, value) {
        const item = new PriorityQItem(value, priority)
        let placed = false

        for (let i = 0; i < this.queue.length; i++) {
            if (this.queue[i].priority > item.priority) {
                this.queue.splice(i, 0, item)
                placed = true
                break
            }
        }

        if (!placed) {
            this.queue.push(item)
        }
    }

    remove() {
        return this.queue.shift()
    }

    isEmpty() {
        return this.queue.length == 0
    }
}

class Spot {
    constructor(row, col, width, total_rows) {
        this.row = row
        this.col = col
        this.width = width
        this.total_rows = total_rows
        this.x = row * width
        this.y = col * width
        this.colour = 'white'
        this.neighbours = []
    }

    valueOf() {
        return [this.row, this.col]
    }

    get_pos() {
        return [this.row, this.col]
    }

    is_closed() {
        return this.colour == 'red'
    }

    is_open() {
        return this.colour == 'green'
    }

    is_barrier() {
        return this.colour == 'black'
    }

    is_start() {
        return this.colour == 'orange'
    }

    is_end() {
        return this.colour == 'light_blue'
    }

    is_route() {
        return this.colour == 'purple'
    }

    reset() {
        this.colour = 'white'
    }

    make_closed() {
        this.colour = 'red'
    }

    make_open() {
        this.colour = 'green'
    }

    make_barrier() {
        this.colour = 'black'
    }

    make_start() {
        this.colour = 'orange'
    }

    make_end() {
        this.colour = '#73e5fc'
    }

    make_route() {
        this.colour = 'purple'
    }

    draw(ctx) {
        // console.log(this)
        // debugger
        ctx.fillStyle = this.colour
        ctx.fillRect(this.y, this.x, this.width, this.width)
    }

    update_neighbours(grid) {
        if (this.row < this.total_rows - 1 && !(grid[this.row + 1][this.col].is_barrier())) { // UP
            this.neighbours.push(grid[this.row + 1][this.col])
        }
        if (this.row > 0 && !(grid[this.row - 1][this.col].is_barrier())) { // DOWN
            this.neighbours.push(grid[this.row - 1][this.col])
        }
        if (this.col < this.total_rows - 1 && !(grid[this.row][this.col + 1].is_barrier())) { // LEFT
            this.neighbours.push(grid[this.row][this.col + 1])
        }
        if (this.col > 0 && !(grid[this.row][this.col - 1].is_barrier())) { // RIGHT
            this.neighbours.push(grid[this.row][this.col - 1])
        }
    }

    // NEED SOME SORT OF COMPARING FUNCTION I THINK IDK THOUGH
}

class Grid {
    constructor(rows, width, canvas, ctx) { // MAYBE REMOVE CANVAS? IDK WHEN TO USE THAT THING
        this.rows = rows
        this.width = width
        this.canvas = canvas
        this.grid = []
        this.ctx = ctx
        this.speed = $('#speed').find(':selected').text()
    }

    make_grid() {
        const grid = []
        const gap = Math.floor(this.width / this.rows)
        for (let i = 0; i < this.rows; i++) {
            grid.push([])
            for (let j = 0; j < this.rows; j++) {
                const spot = new Spot(i, j, gap, this.rows)
                grid[i].push(spot)
            }
        }
        this.grid = grid
    }

    get_spot(row, col) {
        return this.grid[row][col]
    }

    update_neighbours() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.rows; col++) {
                this.grid[row][col].update_neighbours(this.grid)
            }
        }
    }

    draw_grid() {
        // this.ctx.clearRect(0, 0, this.width, this.width)
        const gap = Math.floor(this.width / this.rows)
        this.ctx.strokeStyle = 'grey'

        for (let i = 0; i < this.rows; i++) {
            this.ctx.beginPath()
            this.ctx.moveTo(0, i * gap)
            this.ctx.lineTo(this.width, i * gap)
            this.ctx.stroke()


            this.ctx.beginPath()
            this.ctx.moveTo(i * gap, 0)
            this.ctx.lineTo(i * gap, this.width) // MAY NEED TO CHANGE. DIFFERENT TO ORIGINAL
            this.ctx.stroke()
        }
        // console.log('donw')
        this.ctx.stroke()
    }

    draw() {
        // this.ctx.clearRect(0, 0, this.width, this.width)
        // 
        // debugger
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.rows; col++) {
                const spot = this.grid[row][col]
                if (this.speed != 'Immediate' || !(spot.is_open() || spot.is_closed())) {
                    spot.draw(this.ctx)
                }
            }
        }
        this.draw_grid()
        this.ctx.stroke()
    }

    remove_path() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.rows; col++) {
                const spot = this.grid[row][col]
                if (spot.is_open()) {
                    spot.reset()
                }
                else if (spot.is_closed()) {
                    spot.reset()
                }
                else if (spot.is_route()) {
                    spot.reset()
                }
            }
        }
    }

    find_next(came_from, current) {
        let keys = Object.keys(came_from)
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            if (key == current.valueOf()) {
                return came_from[key]
            }
        }
    }

    reconstruct_path(came_from, current) {
        console.log('ree')
        while (current.valueOf() in came_from) {
            // current = came_from[current.valueOf()]
            current = this.find_next(came_from, current)
            current.make_route()
            if (this.speed != 'Immediate') {
                this.draw() // CAN MAYBE TURN THIS INTO current.draw() to make FASTER?!
            }
        }
    }

    dijkstra(start, end) {
        debugger
        let a = 0
        let count = 0
        let dist = {}
        for (let col = 0; col < this.rows; col++) {
            for (let row = 0; row < this.rows; row++) {
                const spot = this.grid[row][col]
                dist[spot.valueOf()] = Infinity
            }
        }
        dist[start.valueOf()] = 0

        let came_from = {}
        let open_set = new Set
        open_set.add(start)
        let open_list = [start]

        if (this.speed == 'Fast') {// NEED TO ADD SLOW? IDK!
            open_list.push('DRAW')
        }

        while (open_list.length) {
            let current = open_list.shift()
            if (current == 'DRAW') {
                this.draw()
                open_list.push('DRAW')
                continue
            }
            open_set.delete(current)

            if (current == end) {
                this.reconstruct_path(came_from, end)
                end.make_end()
                start.make_start()
                return true
            }

            for (let i = 0; i < current.neighbours.length; i++) {
                let neighbour = current.neighbours[i]
                let distance = count + 1
                if (distance < dist[neighbour.valueOf()]) {
                    count += 1
                    open_list.push(neighbour)
                    open_set.add(neighbour)
                    neighbour.make_open()
                }
            }

            if (this.speed == 'SLOW') {
                this.draw()
            }
            if (current != start) {
                current.make_closed()
            }
        }
        console.log(a)
        return false
    }

    h(p1, p2) {
        const x1 = p1[0]
        const y1 = p1[1]
        const x2 = p2[0]
        const y2 = p2[1]
        return Math.abs(x1 - x2) + Math.abs(y1 - y2)
    }

    astar(start, end) {
        console.log('starting astar')
        //count = 0 // PYTHON CODE NEEDS 3 VALUES FOR PQ. IDK WHAT THEY DO. RIP. I'm IGNORING THE COUNT THINGO.
        let open_set = new PriorityQ()
        open_set.add(0, start)
        let came_from = {}

        let g_score = {}
        for (let col = 0; col < this.rows; col++) {
            for (let row = 0; row < this.rows; row++) {
                const spot = this.grid[row][col]
                g_score[spot.valueOf()] = Infinity                
            }
        }
        g_score[start.valueOf()] = 0
        

        let f_score = {}
        for (let col = 0; col < this.rows; col++) {
            for (let row = 0; row < this.rows; row++) {
                const spot = this.grid[row][col]
                f_score[spot.valueOf()] = Infinity
            }
        }
        f_score[start.valueOf()] = this.h(start.get_pos(), end.get_pos())

        let to_draw = new Set()
        let open_set_hash = new Set()
        open_set_hash.add(start)

        while (!open_set.isEmpty()) {
            let pos = open_set.remove().value
            let current = this.grid[pos.row][pos.col]
            open_set_hash.delete(current)

            if (current == end) {
                this.reconstruct_path(came_from, end)
                end.make_end()
                start.make_start()
                // this.grid.draw()
                setTimeout(this.draw(), 0)
                return true
            }
            
            for (let i = 0; i < current.neighbours.length; i++) {
                let neighbour = current.neighbours[i]
                let temp_g_score = g_score[current.valueOf()] + 1

                if (temp_g_score < g_score[neighbour.valueOf()]) {
                    came_from[neighbour.valueOf()] = current
                    g_score[neighbour.valueOf()] = temp_g_score
                    f_score[neighbour.valueOf()] = temp_g_score + this.h(neighbour.get_pos(), end.get_pos())
                    if (!open_set_hash.has(neighbour)) {
                        // count += 1 // IDK IF USING COUNT.
                        open_set.add(f_score[neighbour.valueOf()], neighbour)
                        open_set_hash.add(neighbour)
                        neighbour.make_open()
                        to_draw.add(neighbour)
                    }
                }
            }

            if (this.speed == 'SLOW') {
                // self.draw()
                setTimeout(this.draw(), 0)
            }
            else if (this.speed == 'FAST') {
                for (let spot of to_draw) {
                    // spot.draw()
                    setTimeout(this.draw(), 0)
                    to_draw.delete(spot)
                }
                to_draw = new Set()
                setTimeout(this.draw(), 0)
                // this.draw() // DOESN"T SEEM RIGHT. LEAVING IT IN THOUGH
            }
            if (current != start) {
                current.make_closed()
            }
        }
        return false
    }

    //get_clicked_position() FIGURE THIS ONE OUT. ITS PROBABLY DIFFERENT :(
    get_clicked_position(event) {
        // console.log('clicked')
        // console.log(event)
        let gap = Math.floor(this.width / this.rows)
        let row = Math.floor(event.offsetY / gap)
        let col = Math.floor(event.offsetX / gap)
        // console.log(row, col)
        return [row, col]
    }
}

function get_size() {
    let ROWS = 50
    if ($('#size').find(':selected').text() == 'Large') {
        ROWS = 100
    }
    return ROWS
}

function get_spot(event) {
    let pos = grid.get_clicked_position(event)
    let row = pos[0]
    let col = pos[1]
    let spot = grid.get_spot(row, col)
    return spot
}

function leftClick(event) {
    let spot = get_spot(event)
    // console.log(spot)
    if (start == null && spot != end) {
        start = spot
        start.make_start()
    }
    else if (end == null && spot != start) {
        end = spot
        end.make_end()
        // console.log('yooo')
    }
    else if (spot != end && spot != start) {
        spot.make_barrier()
    }
    grid.draw()
}

function rightClick(event) {
    let spot = get_spot(event)
    spot.reset()
    if (spot == start) {
        start = null
    }
    else if (spot == end) {
        end = null
    }
}

function changeSize() {
    ctx.clearRect(0, 0, WIDTH, WIDTH)
    // console.log(get_size())
    grid = new Grid(get_size(), WIDTH, canvas, ctx)
    grid.make_grid()
    grid.draw_grid()
}

function run_algorithm() {
    grid.update_neighbours()
    if ($('#algo').find(':selected').text() == 'Astar') {
        console.log('astar')
        grid.astar(start, end)
    }
    else {
        grid.dijkstra(start, end)
    }
}

function reset_grid() {
    start = null
    end = null
    ctx.clearRect(0, 0, WIDTH, WIDTH)
    grid = new Grid(get_size(), WIDTH, canvas, ctx)
    grid.make_grid()
    grid.draw_grid()
}

WIDTH = 600
let grid = new Grid(get_size(), WIDTH, canvas, ctx)
grid.make_grid()
grid.draw_grid()
let start = null
let end = null

canvas.onmousedown = leftClick
canvas.oncontextmenu = rightClick
size.onchange = changeSize
solve.onclick = run_algorithm
reset.onclick = reset_grid