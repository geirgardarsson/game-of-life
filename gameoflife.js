/////////////////////////////////////////////////////////////////
//    Háskóli Íslands 2017 - Tölvugrafík - Geir Garðarsson
//    Game of life, febrúar 2017
/////////////////////////////////////////////////////////////////
var gl;

var numVertices  = 36;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var chance = 0.3;

var rotYear = 0.0;

var time = 0;
var timescale = 100;
var spin = 0.1;

var dna = [];
var rna = [];
var swap = false;

var growstat;
var shrinkstat;

var zDist = -3.5;

var proLoc;
var mvLoc;

// the 8 vertices of the cube
var vertices = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
];



var vertexColors = [
    vec4( 1.0, 1.0, 0.5, 1.0 ),
    vec4( 1.0, 1.0, 0.0, 1.0 ),
    vec4( 1.0, 0.8, 0.0, 1.0 ),
    vec4( 1.0, 0.6, 0.0, 1.0 ),
    vec4( 1.0, 0.4, 0.0, 1.0 ),
    vec4( 1.0, 0.2, 0.0, 1.0 ),
    vec4( 1.0, 0.0, 0.0, 1.0 ),
    vec4( 0.5, 0.0, 0.0, 1.0 )
];

// indices of the 12 triangles that comprise the cube
var indices = [
    1, 0, 3,
    3, 2, 1,
    2, 3, 7,
    7, 6, 2,
    3, 0, 4,
    4, 7, 3,
    6, 5, 1,
    1, 2, 6,
    4, 5, 6,
    6, 7, 4,
    5, 4, 0,
    0, 1, 5
];

window.onload = function init() {

  document.getElementById("life").innerHTML = 'Lífslíkur ' + (chance * 100) + ' %';
  document.getElementById("speedvalue").innerHTML = 'Hraði ' + timescale;

  initializeDNA();

  var canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0, 0, 0, 1.0 );

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  // array element buffer
  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

  // color array attribute buffer
  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );

  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  // vertex array attribute buffer
  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  proLoc = gl.getUniformLocation( program, "projection" );
  mvLoc = gl.getUniformLocation( program, "modelview" );

  var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
  gl.uniformMatrix4fv(proLoc, false, flatten(proj));

  //event listeners for mouse
  canvas.addEventListener("mousedown", function(e) {
    movement = true;
    origX = e.offsetX;
    origY = e.offsetY;
    e.preventDefault(); // Disable drag and drop
  });

  canvas.addEventListener("mouseup", function(e) {
    movement = false;
  });

  canvas.addEventListener("mousemove", function(e) {
    if(movement) {
	    spinY = (spinY + (e.offsetX - origX)) % 360;
      spinX = (spinX + (origY - e.offsetY)) % 360;
      origX = e.offsetX;
      origY = e.offsetY;
    }
  });

  document.getElementById("slider").onchange = function(event) {
    chance = parseInt(event.target.value)/100;
    document.getElementById("life").innerHTML = 'Lífslíkur ' + (chance * 100) + ' % - Ýtið á R til að byrja aftur';
  }

  this.document.getElementById("speed").onchange = (event) => {
    timescale = parseInt(event.target.value);
    document.getElementById("speedvalue").innerHTML = 'Hraði ' + timescale + ' - Minna gildi = hraðar';  
  }

// Event listener for keyboard
window.addEventListener("keydown", function(e) {
  switch(e.keyCode) {
    case 82: //r
      initializeDNA();
      break;
    case 37:
      spin -= 0.01;
      break;
    case 39:
      spin += 0.01;
      break;
  }
});

// Event listener for mousewheel
window.addEventListener("mousewheel", function(e) {
  if(e.wheelDelta > 0) {
    zDist += 0.05;
  } else {
    zDist -= 0.05;
  }
});

render();

}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    growstat = (time % timescale) / timescale;
    shrinkstat = 1 - growstat;

    if (shrinkstat >= 1) { shrinkstat = 0; }
    if (growstat <= 0) { growstat = 1; }

    rotYear += spin;

    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, scalem( 0.1, 0.1, 0.1 ) );
    mv = mult( mv, rotate( parseFloat(spinX), [1, 0, 0] ) );
    mv = mult( mv, rotate( parseFloat(spinY), [0, 1, 0] ) );
    mv = mult(mv, rotate(rotYear, [0, 0.5, 0]));

    var draw = swap ? rna : dna;

    // cube drawing
    var n = 0;
    var y = -9;
    for (var i = 1; i < 11; i++) {
      var x = -9;
      for (var j = 1; j < 11; j++) {
        var z = -9;
        for (var k = 1; k < 11; k++) {
          if (draw[i][j][k] === 'A') {
            drawCube(mv, x, y, z, 1);
          }
          else if (draw[i][j][k] === 'G') {
            drawCube(mv, x, y, z, growstat);
          }
          else if (draw[i][j][k] === 'T') {
            drawCube(mv, x, y, z, shrinkstat);
          }
          z += 2;
          n++;
        }
        x += 2;
      }
      y += 2;
    }

    if (time % timescale === 0) {
      if (!swap) {
        stabilize(dna);
        stabilize(rna);
        rna = evolve(dna, rna);
        swap = true;
      }
      else if (swap) {
        stabilize(dna);
        stabilize(rna);
        dna = evolve(rna, dna);
        swap = false;
      }
    }

    time++;
    requestAnimFrame( render );
}


function evolve (current, next) {
  var n = 0;
  for (var i = 1; i < 11; i++) {
    for (var j = 1; j < 11; j++) {
      for (var k = 1; k < 11; k++) {
        n = count(current, i, j, k)

        if (current[i][j][k] === 'C') {
          // Check whether a cube is born
          if (n === 6) {
            next[i][j][k] = 'G';
          }
          else {
            next[i][j][k] = 'C';
          }
        }

        else if (current[i][j][k] === 'A') {
          // tékka hvort hann deyji
          if (n === 5 || n === 6 || n === 7) {
            next[i][j][k] = 'A';
          }
          else {
            next[i][j][k] = 'T';
          }
        }
      }
    }
  }
  return next;
}


function count(current, i, j, k) {
  var n = 0;

  for (var a = i-1; a <= i+1; a++) {
    for (var b = j-1; b <= j+1; b++) {
      for (var c = k-1; c <= k+1; c++) {
        if (current[a][b][c] === 'A') {
          n++;
        }
      }
    }
  }

  if (current[i][j][k] === 'A') { n-- }

  return n;
}


function initializeDNA() {

  swap = false;

  for (var i = 0; i < 12; i++) {
    dna[i] = [];
    rna[i] = [];
    for (var j = 0; j < 12; j++) {
      dna[i][j] = [];
      rna[i][j] = [];
      for (var k = 0; k < 12; k++) {
        dna[i][j][k] = 'X';
        rna[i][j][k] = 'X';
      }
    }
  }

  //gefum kubbnum lifandi eða dauð gildi
  for (k = 1; k < 11; k++) {
    for (i = 1; i < 11; i++) {
      for (j = 1; j < 11; j++) {
        if (Math.random() < chance) {
          dna[k][i][j] = 'A';
        }
        else {
          dna[k][i][j] = 'C';
        }
      }
    }
  }
}

function stabilize (string) {
  for (var i = 1; i < 11; i++) {
    for (var j = 1; j < 11; j++) {
      for (var k = 1; k < 11; k++) {
        if (string[i][j][k] === 'G') {
          string[i][j][k] = 'A';
        }
        if (string[i][j][k] === 'T') {
          string[i][j][k] = 'C';
        }
      }
    }
  }
}

function drawCube(mv, x, y, z, s) {
  mv = mult(mv, translate(x, y, z));
  mv = mult(mv, scalem(s, s, s));
  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );
}
