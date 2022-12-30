
const tools = {
    "ERASER": 321,
    "TIP": 320
};
// Thanks https://github.com/ichaozi/RemarkableFramebuffer
var MAX_X = 10500; // I admit, I brute-force this value
var MAX_Y = 7877; // I admit, I brute-force this value
var RATIO = MAX_X / MAX_Y;
var MAX_PRESSURE = 4095;
var MAX_DISPLAY_PRESSURE = 10;
var RINGBUFFER_SIZE = 10;
var last_tool = tools.ERASER;
var CANVAS_HEIGHT = MAX_Y / 10;
var CANVAS_WIDTH = MAX_X / 10;

// landscape / portrait
var rotate = false;

var canvas = document.getElementById("canvas");
var canvas_overlay = document.getElementById("canvas-overlay");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas_overlay.width = CANVAS_WIDTH;
canvas_overlay.height = CANVAS_HEIGHT;
var ctx = canvas.getContext("2d");
var ctx_overlay = canvas_overlay.getContext("2d");

// Stroke only for drawing, fill only for debug.
ctx.lineWidth = 1;


let scaleX = canvas.width / MAX_X / 2;
let scaleY = canvas.height / MAX_Y / 2;
let scalePressure = MAX_DISPLAY_PRESSURE / MAX_PRESSURE;

let penState = false;

// Ring buffer to smooth out values.
let ringbufferX = new Float64Array(RINGBUFFER_SIZE);
let ringbufferY = new Float64Array(RINGBUFFER_SIZE);
let ringbufferZ = new Float64Array(RINGBUFFER_SIZE);

let rbI = 0;

let debug = false;

let lastX = null;
let lastY = null;

let penColor = "rgb(0, 0, 0)";


pen_menu_logo = document.getElementById("pen")
pen_menu_logo.addEventListener('load', function () {
    if (last_tool == tools.TIP && penColor != pencolors.BLACK) {
        pen_menu_logo.contentDocument.getElementById("icon").setAttribute("fill", penColor);
    } else {
        pen_menu_logo.contentDocument.getElementById("icon").setAttribute("fill", "#efeff3");
    }
});


function draw() {
    // Loop through ringbuffer elements...
    // Average all ringbuffer elements where the pressure is nonzeroish.
    let avgX = 0;
    let avgY = 0;
    let cnt = 0;
    for (i = 0; i < RINGBUFFER_SIZE; i++) {
        // If this does look like the end of a stroke, still use the whole
        // framebuffer. It's short enough to drain quickly without confusing
        // this stroke with the next.
        if (ringbufferZ[i] > 10) {
            avgX += ringbufferX[i];
            avgY += ringbufferY[i];
            cnt += 1;
        }
    }

    avgX /= cnt;
    avgY /= cnt;
    avgX *= scaleX;
    avgY *= scaleY;
    ctx.arc(1, 100, 10, 0, 2 * Math.PI);

    // If there were zero entries with nonzero pressure, that's the
    // end of a stroke. Forget the last point.
    if (cnt == 0) {
        penState = false;
        lastX = null;
        lastY = null;
    } else {
        // Only start drawing if we already started a line.
        if (penState) {
            if (last_tool == tools.TIP) {
                if (!penColor.length) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(avgX, avgY, 10, 0, 2 * Math.PI);
                    ctx.clip();
                    ctx.clearRect(avgX - 11, avgY - 11, 22, 22);
                    ctx.restore();
                } else {
                    ctx.strokeStyle = penColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(avgX, avgY);
                    ctx.stroke();
                }
            } else if (last_tool == tools.ERASER) {
                ctx.clearRect(avgX - 10, avgY - 10, 20, 20);
            }
        }
        penState = true;

        // Always assign last x and y when there's pen pressure,
        // to mark the start of a line.
        lastX = avgX;
        lastY = avgY;
    }
}


function overlay(x, y) {
    // Clear when hovering, but keep drawing for the duration of a stroke to highlight it.
    if (!penState) {
        ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
    }
    ctx_overlay.fillStyle = "rgb(200, 200, 255)";
    ctx_overlay.beginPath();
    ctx_overlay.arc(x, y, 10, 0, 2 * Math.PI);
    ctx_overlay.fill();
}

