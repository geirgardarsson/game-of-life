/////////////////////////////////////////////////////////////////
//    S�nid�mi � T�lvugraf�k
//     J�r� og Mars sn�ast um s�lina (allt teningar!)
//
//    Hj�lmt�r Hafsteinsson, febr�ar 2017
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 36;

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;


var x = -9;
var y = -9;
var z = -9;

var boxcount = 0;
var consolebuffer = 0;

var rotYear = 0.0;

var dna = [];

var s0,s1,s2,s3,s4,s5,s6,s7,s8,s9;
var t0,t1,t2,t3,t4,t5,t6,t7,t8,t9;

dna = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9];

var dnaTest;



var rna = [];
var rnaTest;
var swap = false;

rna = [t0,t1,t2,t3,t4,t5,t6,t7,t8,t9]

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
    vec4( 1.0, 1.0, 0.5, 1.0 ),   // white
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // blue
    vec4( 1.0, 0.8, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 0.6, 0.0, 1.0 ),  // green
    vec4( 1.0, 0.4, 0.0, 1.0 ),  // cyan
    vec4( 1.0, 0.2, 0.0, 1.0 ),  // magenta
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.5, 0.0, 0.0, 1.0 )  // black
];

// indices of the 12 triangles that compise the cube
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

window.onload = function init()
{

    //upphafsstillum dna-strenginn okkar
    //þurfum 1728 stafi í strengnum (12^3), við notum bara 10^3 kubba en við
    //þurfum tóm sæti í kringum þá svo samanburðirnir verði ekki 'out of bounds'
    /*for (var l = 0; l < 1000; l++) {
      if (Math.random() < 0.2) {
        dna += 'A';
      }
      else {
        dna += 'D';
      }
    }
    //console.log(dna);*/








    //upphafsstillum báða dna strengina okkar

    for (var i = 0; i < 10; i++) {
      dna[i] = [];
      for (var j = 0; j < 10; j++) {
        dna[i][j] = [];
        for (var k = 0; k < 10; k++) {
          dna[i][j][k] = undefined;
        }
      }
    }

    for (i = 0; i < 10; i++) {
      rna[i] = [];
      for (j = 0; j < 10; j++) {
        rna[i][j] = [];
        for (k = 0; k < 10; k++) {
          rna[i][j][k] = undefined;
        }
      }
    }

    rnaTest = rna[1];



    //gefum kubbnum lifandi eða dauð gildi
    for (k = 0; k < 10; k++) {
      for (i = 0; i < 10; i++) {
        for (j = 0; j < 10; j++) {
          if (Math.random() < 0.3) {
            dna[k][i][j] = 'A';
          }
          else {
            dna[k][i][j] = 'D';
          }
        }
      }
    }


    //console.log(dna);
    //console.log(rna);


    dnaTest = dna[1];
    //console.log('test', dnaTest);




    canvas = document.getElementById( "gl-canvas" );

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
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );


    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp �r
                zDist += 0.1;
                break;
            case 40:	// ni�ur �r
                zDist -= 0.1;
                break;
            case 69:
            if (!swap) {
              rna = evolve(dna, rna);
              swap = true;
            }
            else if (swap) {
              dna = evolve(rna, dna);
              swap = false;
            }
            break;
         }
     }  );

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.05;
         } else {
             zDist -= 0.05;
         }
     }  );

    render();
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mvstack = [];

    //rotYear += 0.05;

    // sta�setja �horfanda og me�h�ndla m�sarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, scalem( 0.1, 0.1, 0.1 ) );
    mv = mult( mv, rotate( parseFloat(spinX), [1, 0, 0] ) );
    mv = mult( mv, rotate( parseFloat(spinY), [0, 1, 0] ) );
    mv = mult(mv, rotate(rotYear, [-0.1, 0.5, 0]));

    //teiknum kubbana!
    var n = 0;
    y = -9;
    for (var i = 0; i < 10; i++) {
      x = -9;
      for (var j = 0; j < 10; j++) {
        z = -9;
        for (var k = 0; k < 10; k++) {
          if (dna[i][j][k] === 'A') {
            mvstack.push(mv);
            mv = mult(mv, translate(x, y, z));
            gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
            gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );
            mv = mvstack.pop();
          }
          z += 2;
          n++;
        }
        x += 2;
      }
      y += 2;
    }

    //console logs herna!
    if (consolebuffer % 200 === 0) {
      //console.log(boxcount);
    }

    consolebuffer++;
    requestAnimFrame( render );
}


function evolve (current, next) {
  var n = 0;
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      for (var k = 0; k < 10; k++) {
        n = count(current, i, j, k)

        if (current[i][j][k] === 'D') {
          // tékk hvort hann lifni við
          if (n === 6) {
            next[i][j][k] = 'A';
          }
          else {
            next[i][j][k] = 'D';
          }
        }

        else if (current[i][j][k] === 'A') {
          // tékka hvort hann deyji
          if (n === 5 || n === 6 || n === 7) {
            next[i][j][k] = 'A';
          }
          else {
            next[i][j][k] = 'D';
          }
        }
      }
    }
  }
  return next;
}

//TELJUM NÁGRANNANA - ÞESSI KÓÐI ER LJÓTUR EN ÉG VEIT EKKI BETUR
//2/3/2017 #soz
function count(current, i, j, k) {
  var n = 0;

  if (i !== 0 || j !== 0 || k !== 0) {
    if (current[i-1][j-1][k-1] === 'A') {n++}}

  if (i !== 0 || j !== 0) {
    if (current[i-1][j-1][k] === 'A') {n++}}

  if (i !== 0 || j !== 0 || k !== 9) {
    if (current[i-1][j-1][k+1] === 'A') {n++}}

  if (i !== 0 || k !== 0) {
    if (current[i-1][j][k-1] === 'A') {n++}}

  if (i !== 0) {
    if (current[i-1][j][k] === 'A') {n++}}

  if (i !== 0 || k !== 9) {
    if (current[i-1][j][k+1] === 'A') {n++}}

  if (i !== 0 || j !== 9 || k !== 0) {
    if (current[i-1][j+1][k-1] === 'A') {n++}}

  if (i !== 0 || j !== 9) {
    if (current[i-1][j+1][k] === 'A') {n++}}

  if (i !== 0 || j !== 9 || k !== 9) {
    if (current[i-1][j+1][k+1] === 'A') {n++}}

  if (j !== 0 || k !== 0) {
    if (current[i][j-1][k-1] === 'A') {n++}}

  if (j !== 0) {
    if (current[i][j-1][k] === 'A') {n++}}

  if (j !== 0 || k !== 9) {
    if (current[i][j-1][k+1] === 'A') {n++}}

  if (k !== 0) {
    if (current[i][j][k-1] === 'A') {n++}}

  //tékkum ekki kubbinn sjálfan current[i][j][k]

  if (k !== 9) {
    if (current[i][j][k+1] === 'A') {n++}}

  if (j !== 9 || k !== 0) {
    if (current[i][j+1][k-1] === 'A') {n++}}

  if (j !== 9) {
    if (current[i][j+1][k] === 'A') {n++}}

  if (j !== 9 || k !== 9) {
    if (current[i][j+1][k+1] === 'A') {n++}}

  if (i !== 9 || j !== 0 || k !== 0) {
    if (current[i+1][j-1][k-1] === 'A') {n++}}

  if (i !== 9 || j !== 0) {
    if (current[i+1][j-1][k] === 'A') {n++}}

  if (i !== 9 || j !== 0 || k !== 9) {
    if (current[i+1][j-1][k+1] === 'A') {n++}}

  if (i !== 9 || k !== 0) {
    if (current[i+1][j][k-1] === 'A') {n++}}

  if (i !== 9) {
    if (current[i+1][j][k] === 'A') {n++}}

  if (i !== 9 || k !== 9) {
    if (current[i+1][j][k+1] === 'A') {n++}}

  if (i !== 9 || j !== 9 || k !== 0) {
    if (current[i+1][j+1][k-1] === 'A') {n++}}

  if (i !== 9 || j !== 9) {
    if (current[i+1][j+1][k] === 'A') {n++}}

  if (i !== 9 || j !== 9 || k !== 9) {
    if (current[i+1][j+1][k+1] === 'A') {n++}}

  return n;
}










// fall fyrir 2D game of life
function revolve(current, next) {
  var n = 0;
  for (var j = 0; j < 10; j++) {
    for (var i = 0; i < 10; i++) {
      n = countN(current, j, i);
      if (current[j][i] === 'D') {
        // tékka ef hann lifnar við
        if (n === 3) {
          next[j][i] = 'A';
        }
        else {
          next[j][i] = 'D'
        }
      }
      else if (current[j][i] === 'A') {
        //tékka ef hann deyr eða lifir
        if (n === 3 || n === 4) {
          next[j][i] = 'A';
        }
        else {
          next[j][i] = 'D';
        }
      }
    }
  }

  return next;
}

//count the neighbors
function countN(current, j , i) {
  var n = 0;

  if (j !== 0 && i !== 0) {
    if (current[j-1][i-1] === 'A') {n++}
  }

  if (j !== 0) {
    if (current[j-1][i] === 'A') {n++}
  }

  if (j !== 0 && i !== 9) {
    if (current[j-1][i+1] === 'A') {n++}
  }

  if (i !== 0) {
    if (current[j][i-1] === 'A') {n++}
  }

  if (i !== 0 && j !== 9) {
    if (current[j+1][i-1] === 'A') {n++}
  }

  if (i !== 9) {
    if (current[j][i+1] === 'A') {n++}
  }

  if (j !== 9) {
    if (current[j+1][i] === 'A') {n++}
  }

  if (j !== 9 && i !== 9) {
    if (current[j+1][i+1] === 'A') {n++}
  }

  return n;
}

function dnaPrint(story) {
  var print = '';
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      print += story[i][j];
    }
    console.log(print.substring(i, i+10));
  }
}


function dnaPrint2(string) {
  console.log(string);
  var nums = '';
  for (var i = 0; i < string.length; i++) {
    nums += i%10;
  }
  console.log(nums);
}
