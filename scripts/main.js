(function () {
  const PACMAN_SIZE = 0.25;
  const GHOST_SIZE = PACMAN_SIZE * 1.25;
  const DOT_SIZE = 0.1;
  const POWER_DOT = DOT_SIZE * 1.5;
  const UP = new THREE.Vector3(0, 0, -1);
  const LEFT = new THREE.Vector3(-1, 0, 0);
  const TOP = new THREE.Vector3(0, 1, 0);
  const RIGHT = new THREE.Vector3(1, 0, 0);
  const BOTTOM = new THREE.Vector3(0, -1, 0);
  const GRID = [
    '# # # # # # # # # # # # # # # # # # # # # # # # # # # #',
    '# . . . . . . . . . . . . # # . . . . . . . . . . . . #',
    '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
    '# o # # # # . # # # # # . # # . # # # # # . # # # # o #',
    '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
    '# . . . . . . . . . . . . . . . . . . . . . . . . . . #',
    '# . # # # # . # # . # # # # # # # # . # # . # # # # . #',
    '# . # # # # . # # . # # # # # # # # . # # . # # # # . #',
    '# . . . . . . # # . . . . # # . . . . # # . . . . . . #',
    '# # # # # # . # # # # #   # #   # # # # # . # # # # # #',
    '          # . # # # # #   # #   # # # # # . #          ',
    '          # . # #         G           # # . #          ',
    '          # . # #   # # # # # # # #   # # . #          ',
    '# # # # # # . # #   #             #   # # . # # # # # #',
    '            .       #             #       .            ',
    '# # # # # # . # #   #             #   # # . # # # # # #',
    '          # . # #   # # # # # # # #   # # . #          ',
    '          # . # #                     # # . #          ',
    '          # . # #   # # # # # # # #   # # . #          ',
    '# # # # # # . # #   # # # # # # # #   # # . # # # # # #',
    '# . . . . . . . . . . . . # # . . . . . . . . . . . . #',
    '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
    '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
    '# o . . # # . . . . . . o P   . . . . . . . # # . . o #',
    '# # # . # # . # # . # # # # # # # # . # # . # # . # # #',
    '# # # . # # . # # . # # # # # # # # . # # . # # . # # #',
    '# . . . . . . # # . . . . # # . . . . # # . . . . . . #',
    '# . # # # # # # # # # # . # # . # # # # # # # # # # . #',
    '# . # # # # # # # # # # . # # . # # # # # # # # # # . #',
    '# . . . . . . . . . . . . . . . . . . . . . . . . . . #',
    '# # # # # # # # # # # # # # # # # # # # # # # # # # # #',
  ];
  //globals for now as it is the easiest way and time is a factor
  let pacmanSpeed = 1.7;
  let ghostSpeed = 1.5;
  let numberOfGhosts = 0;

  const createMap = function (scene, levelDefinition) {
    const map = {};
    map.bottom = -(levelDefinition.length - 1);
    map.top = 0;
    map.left = 0;
    map.right = 0;
    map.numDots = 0;
    map.pacmanSpawn = null;
    map.ghostSpawn = null;

    let x, y;
    for (let row = 0; row < levelDefinition.length; row++) {
      //match grid to objects
      y = -row;

      map[y] = {};

      // Get the length of the longest row in the gird
      const length = Math.floor(levelDefinition[row].length / 2);
      map.right = Math.max(map.right, length);

      for (let column = 0; column < levelDefinition[row].length; column += 2) {
        x = Math.floor(column / 2);

        const cell = levelDefinition[row][column];
        let object = null;
        //generate cells by calling create Blah for the matching char
        if (cell === '#') {
          object = createWall();
        } else if (cell === '.') {
          object = createDot();
          map.numDots += 1;
        } else if (cell === 'o') {
          object = createPowerPellet();
        } else if (cell === 'P') {
          map.pacmanSpawn = new THREE.Vector3(x, y, 0);
        } else if (cell === 'G') {
          map.ghostSpawn = new THREE.Vector3(x, y, 0);
        }

        if (object !== null) {
          object.position.set(x, y, 0);
          map[y][x] = object;
          scene.add(object);
        }
      }
    }

    map.centerX = (map.left + map.right) / 2;
    map.centerY = (map.bottom + map.top) / 2;

    return map;
  };

  const getPos = function (map, position) {
    const x = Math.round(position.x),
      y = Math.round(position.y);
    return map[y] && map[y][x];
  };

  const isWall = function (map, position) {
    const cell = getPos(map, position);
    return cell && cell.isWall === true;
  };

  //need the scene here even though it is not directly used, it is used to get the object
  const hideElement = function (map, scene, position) {
    const x = Math.round(position.x),
      y = Math.round(position.y);
    if (map[y] && map[y][x]) {
      //hide element when eaten
      map[y][x].visible = false;
    }
  };

  const createWall = (function () {
    const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x1919a6 });

    return function () {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.isWall = true;
      return wall;
    };
  })();

  const createDot = (function () {
    const dotGeometry = new THREE.SphereGeometry(DOT_SIZE, 50, 50);
    const dotMaterial = new THREE.MeshPhongMaterial({ color: 0xdea185 });

    return function () {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.isDot = true;

      return dot;
    };
  })();

  const createPowerPellet = (function () {
    const pelletGeometry = new THREE.SphereGeometry(POWER_DOT, 50, 50);
    const pelletMaterial = new THREE.MeshPhongMaterial({ color: 0xdea185 });

    return function () {
      const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
      pellet.isPowerPellet = true;

      return pellet;
    };
  })();

  const createRenderer = function () {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor('black', 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return renderer;
  };

  const createScene = function () {
    const scene = new THREE.Scene();

    // Add lighting
    scene.add(new THREE.AmbientLight(0x888888));
    const light = new THREE.SpotLight('white', 0.5);
    light.position.set(0, 0, 50);
    scene.add(light);

    return scene;
  };

  const createHudCamera = function (map) {
    const halfWidth = (map.right - map.left) / 2;
    const halfHeight = (map.top - map.bottom) / 2;

    const hudCamera = new THREE.OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      1.1,
      100
    );
    hudCamera.position.copy(new THREE.Vector3(map.centerX, map.centerY, 10));
    hudCamera.lookAt(new THREE.Vector3(map.centerX, map.centerY, 0));

    return hudCamera;
  };

  const renderHud = function (renderer, hudCamera, scene) {
    // Increase size of the dots in HUD to make them easier to see.
    scene.children.forEach(function (object) {
      if (object.isWall !== true) object.scale.set(2.3, 2.3, 2.3);
    });

    //render to bottom left 200x200 area
    renderer.setScissorTest(true);
    renderer.setScissor(10, 10, 200, 200);
    renderer.setViewport(10, 10, 200, 200);
    renderer.render(scene, hudCamera);
    renderer.setScissorTest(false);

    // Reset scales after rendering HUD.
    scene.children.forEach(function (object) {
      object.scale.set(1, 1, 1);
    });
  };

  const createPacman = (function () {
    // Create spheres with decreasingly small horizontal sweeps, in order
    // to create pacman "death" animation.
    const pacmanGeometries = [];
    let numFrames = 60;
    let offset;
    for (let i = 0; i < numFrames; i++) {
      offset = (i / (numFrames - 1)) * Math.PI;
      pacmanGeometries.push(
        new THREE.SphereGeometry(
          PACMAN_SIZE,
          50,
          50,
          offset,
          Math.PI * 2 - offset * 2
        )
      );
      pacmanGeometries[i].rotateX(Math.PI / 2);
    }

    const pacmanMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdff00,
      side: THREE.DoubleSide,
    });

    return function (scene, position) {
      const pacman = new THREE.Mesh(pacmanGeometries[0], pacmanMaterial);
      pacman.frames = pacmanGeometries;
      pacman.currentFrame = 0;

      pacman.isPacman = true;
      pacman.isWrapper = true;
      pacman.atePellet = false;
      pacman.distanceMoved = 0;

      pacman.position.copy(position);
      pacman.direction = new THREE.Vector3(-1, 0, 0);

      scene.add(pacman);

      return pacman;
    };
  })();

  const createGhost = (function () {
    const ghostGeometry = new THREE.SphereGeometry(GHOST_SIZE, 16, 16);

    return function (scene, position, color) {
      const ghostMaterial = new THREE.MeshPhongMaterial({ color: color });
      const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
      ghost.isGhost = true;
      ghost.isWrapper = true;
      ghost.isAfraid = false;
      ghost.number = numberOfGhosts;
      ghost.position.copy(position);
      ghost.direction = new THREE.Vector3(-1, 0, 0);
      scene.add(ghost);
    };
  })();

  const wrapObject = function (object, map) {
    if (object.position.x < map.left) object.position.x = map.right;
    else if (object.position.x > map.right) object.position.x = map.left;

    if (object.position.y > map.top) object.position.y = map.bottom;
    else if (object.position.y < map.bottom) object.position.y = map.top;
  };

  const distance = (function () {
    const difference = new THREE.Vector3();

    return function (object1, object2) {
      // Calculate difference between objects' positions.
      difference.copy(object1.position).sub(object2.position);

      return difference.length();
    };
  })();

  const createkeyMap = function () {
    // Keep track of current keys being pressed.
    const keyMap = {};

    document.body.addEventListener('keydown', function (event) {
      keyMap[event.keyCode] = true;
      keyMap[String.fromCharCode(event.keyCode)] = true;
    });
    document.body.addEventListener('keyup', function (event) {
      keyMap[event.keyCode] = false;
      keyMap[String.fromCharCode(event.keyCode)] = false;
    });
    document.body.addEventListener('blur', function (event) {
      // Make it so that all keys are unpressed when the browser loses focus.
      for (const key in keyMap) {
        if (keyMap.hasOwnProperty(key)) keyMap[key] = false;
      }
    });

    return keyMap;
  };

  const animationLoop = function (callback, requestFrameFunction) {
    requestFrameFunction = requestFrameFunction || requestAnimationFrame;

    let previousFrameTime = window.performance.now();

    // How many seconds the animation has progressed in total.
    let animationTime = 0;

    const render = function () {
      let now = window.performance.now();
      let animationDelta = (now - previousFrameTime) / 1000;
      previousFrameTime = now;
      animationDelta = Math.min(animationDelta, 1 / 30);

      // Keep track of how many seconds of animation has passed.
      animationTime += animationDelta;

      callback(animationDelta, animationTime);

      requestFrameFunction(render);
    };

    requestFrameFunction(render);
  };

  const main = function () {
    const keys = createkeyMap();

    const renderer = createRenderer();
    const scene = createScene();

    const map = createMap(scene, GRID);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.up.copy(UP);
    camera.targetPosition = new THREE.Vector3();
    camera.targetLookAt = new THREE.Vector3();
    camera.lookAtPosition = new THREE.Vector3();

    const hudCamera = createHudCamera(map);

    const pacman = createPacman(scene, map.pacmanSpawn);

    let ghostSpawnTime = -6;

    let won = false;
    let lost = false;
    let lostTime, wonTime;

    const chompSound = new Audio('../sounds/pacman_chomp.mp3');
    chompSound.volume = 0.3;
    chompSound.loop = true;
    chompSound.preload = 'auto';

    const levelStartSound = new Audio('../sounds/pacman_beginning.mp3');
    levelStartSound.preload = 'auto';

    levelStartSound.autoplay = true;

    const deathSound = new Audio('../sounds/pacman_death.mp3');
    deathSound.preload = 'auto';

    const eatGhost = new Audio('../sounds/pacman_eatghost.mp3');
    eatGhost.preload = 'auto';

    const remove = [];

    let lives = 3;
    const livesContainer = document.getElementById('lives');
    for (let i = 0; i < lives; i++) {
      const life = document.createElement('img');
      life.src = '../images/pacman.png';
      livesContainer.appendChild(life);
      life.className = 'life';
    }
    let numDotsEaten = 0;
    let score = 0;
    const scoreDisplay = document.getElementById('score');
    const update = function (delta, now) {
      updatePacman(delta, now);
      updateCamera(delta, now);

      scene.children.forEach(function (object) {
        if (object.isGhost === true) updateGhost(object, delta, now);
        if (object.isWrapper === true) wrapObject(object, map);
        if (object.isTemporary === true && now > object.removeAfter)
          remove.push(object);
      });

      remove.forEach(scene.remove, scene);
      for (let item in remove) {
        if (remove.hasOwnProperty(item)) {
          scene.remove(remove[item]);
          delete remove[item];
        }
      }

      if (numberOfGhosts < 4 && now - ghostSpawnTime > 6) {
        if (numberOfGhosts === 0) {
          createGhost(scene, map.ghostSpawn, 0xd03e19);
          numberOfGhosts++;
          ghostSpawnTime = now;
        } else if (numberOfGhosts === 1) {
          createGhost(scene, map.ghostSpawn, 0xdb851c);
          numberOfGhosts++;
          ghostSpawnTime = now;
        } else if (numberOfGhosts === 2) {
          createGhost(scene, map.ghostSpawn, 0xea82e5);
          numberOfGhosts++;
          ghostSpawnTime = now;
        } else if (numberOfGhosts === 3) {
          createGhost(scene, map.ghostSpawn, 0x46bfee);
          numberOfGhosts++;
          ghostSpawnTime = now;
        }
      }
    };
    let _diff = new THREE.Vector3();
    const showText = function (message, size, now) {
      const loader = new THREE.FontLoader();
      loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
        let textGeometry = new THREE.TextGeometry(message, {
          font: font,
          size: size,
          height: 0.05,
        });

        const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        let text = new THREE.Mesh(textGeometry, textMaterial);

        text.position.copy(pacman.position).add(UP);

        text.up.copy(pacman.direction);
        text.lookAt(text.position.clone().add(UP));

        text.isTemporary = true;
        text.removeAfter = now + 5;

        scene.add(text);
        return text;
      });
    };

    const updatePacman = function (delta, now) {
      if (!won && !lost) {
        chompSound.play();
      } else {
        chompSound.pause();
      }

      if (!won && !lost) {
        movePacman(delta);
      }

      if (!won && numDotsEaten === map.numDots) {
        won = true;
        wonTime = now;

        showText('You won =D', 1, now);
        levelStartSound.play();
      }

      if (won && now - wonTime > 3) {
        pacman.position.copy(map.pacmanSpawn);
        pacman.direction.copy(LEFT);
        pacman.distanceMoved = 0;

        scene.children.forEach(function (object) {
          if (object.isDot === true || object.isPowerPellet === true)
            object.visible = true;
          if (object.isGhost === true) remove.push(object);
        });

        pacmanSpeed += 1;
        ghostSpeed += 1;

        won = false;
        numDotsEaten = 0;
        numberOfGhosts = 0;
        score = 0;
      }

      if (lives > 0 && lost && now - lostTime > 4) {
        lost = false;
        pacman.position.copy(map.pacmanSpawn);
        pacman.direction.copy(LEFT);
        pacman.distanceMoved = 0;
      }

      if (lost) {
        const angle = ((now - lostTime) * Math.PI) / 2;
        const frame = Math.min(
          pacman.frames.length - 1,
          Math.floor((angle / Math.PI) * pacman.frames.length)
        );

        pacman.geometry = pacman.frames[frame];
      } else {
        const maxAngle = Math.PI / 4;
        let angle = (pacman.distanceMoved * 2) % (maxAngle * 2);
        if (angle > maxAngle) angle = maxAngle * 2 - angle;
        let frame = Math.floor((angle / Math.PI) * pacman.frames.length);

        pacman.geometry = pacman.frames[frame];
      }
    };

    const _lookAt = new THREE.Vector3();
    const movePacman = function (delta) {
      pacman.up.copy(pacman.direction).applyAxisAngle(UP, -Math.PI / 2);
      pacman.lookAt(_lookAt.copy(pacman.position).add(UP));
      let currentPosition = new THREE.Vector3();
      if (lives > 0) {
        // pacman.translateOnAxis(LEFT, pacmanSpeed * delta);
        pacman.translateOnAxis(LEFT, delta * pacmanSpeed);
        currentPosition
          .copy(pacman.position)
          .addScaledVector(pacman.direction, 0.5)
          .round();
      }
      if (keys['A']) {
        pacman.direction.applyAxisAngle(UP, (Math.PI / 2) * delta);
      }
      if (keys['D']) {
        pacman.direction.applyAxisAngle(UP, (-Math.PI / 2) * delta);
      }
      if (keys['S']) {
        pacman.translateOnAxis(LEFT, -pacmanSpeed * delta);
        pacman.distanceMoved += pacmanSpeed * delta;
      }

      const leftSide = pacman.position
        .clone()
        .addScaledVector(LEFT, PACMAN_SIZE)
        .round();
      const topSide = pacman.position
        .clone()
        .addScaledVector(TOP, PACMAN_SIZE)
        .round();
      const rightSide = pacman.position
        .clone()
        .addScaledVector(RIGHT, PACMAN_SIZE)
        .round();
      const bottomSide = pacman.position
        .clone()
        .addScaledVector(BOTTOM, PACMAN_SIZE)
        .round();
      if (isWall(map, leftSide)) {
        pacman.position.x = leftSide.x + 0.5 + PACMAN_SIZE;
      }
      if (isWall(map, rightSide)) {
        pacman.position.x = rightSide.x - 0.5 - PACMAN_SIZE;
      }
      if (isWall(map, topSide)) {
        pacman.position.y = topSide.y - 0.5 - PACMAN_SIZE;
      }
      if (isWall(map, bottomSide)) {
        pacman.position.y = bottomSide.y + 0.5 + PACMAN_SIZE;
      }

      const cell = getPos(map, pacman.position);
      if (cell && cell.isDot === true && cell.visible === true) {
        hideElement(map, scene, pacman.position);
        numDotsEaten += 1;
        score += 1;
        scoreDisplay.textContent = `Score: ${score}`;
      }

      pacman.atePellet = false;
      if (cell && cell.isPowerPellet === true && cell.visible === true) {
        hideElement(map, scene, pacman.position);
        pacman.atePellet = true;

        eatGhost.play();
      }
    };

    const updateCamera = function (delta, now) {
      if (won) {
        // After winning, pan camera out to show whole level
        camera.targetPosition.set(map.centerX, map.centerY, 30);
        camera.targetLookAt.set(map.centerX, map.centerY, 0);
      } else if (lost) {
        // After losing, move camera to look down at pacman
        camera.targetPosition = pacman.position.clone().addScaledVector(UP, 4);
        camera.targetLookAt = pacman.position
          .clone()
          .addScaledVector(pacman.direction, 0.01);
      } else {
        // Place camera above and behind pacman
        camera.targetPosition
          .copy(pacman.position)
          .addScaledVector(UP, 1.5)
          .addScaledVector(pacman.direction, -1);
        camera.targetLookAt.copy(pacman.position).add(pacman.direction);
      }

      // Move camera slowly during win/lose animations
      const cameraSpeed = lost || won ? 1 : 10;
      camera.position.lerp(camera.targetPosition, delta * cameraSpeed);
      camera.lookAtPosition.lerp(camera.targetLookAt, delta * cameraSpeed);
      camera.lookAt(camera.lookAtPosition);
    };

    const updateGhost = function (ghost, delta, now) {
      if (pacman.atePellet === true) {
        ghost.isAfraid = true;
        ghost.becameAfraidTime = now;
        ghost.material.color.setStyle('white');
      }

      // Make ghosts not afraid after 10 seconds
      if (ghost.isAfraid && now - ghost.becameAfraidTime > 10) {
        ghost.isAfraid = false;
        if (ghost.number === 0) {
          ghost.material.color.setStyle('#d03e19');
        } else if (ghost.number === 1) {
          ghost.material.color.setStyle('#db851c');
        } else if (ghost.number === 2) {
          ghost.material.color.setStyle('#ea82e5');
        } else if (ghost.number === 3) {
          ghost.material.color.setStyle('#46bfee');
        }
      }

      moveGhost(ghost, delta);

      // Check for collision between Pacman and ghost.
      if (!lost && !won && distance(pacman, ghost) < PACMAN_SIZE + GHOST_SIZE) {
        if (ghost.isAfraid === true) {
          remove.push(ghost);
          numberOfGhosts -= 1;

          eatGhost.play();
        } else {
          lives -= 1;
          // Remove a life
          document.getElementsByClassName('life')[lives].style.display = 'none';
          if (lives > 0) showText('You died =(', 0.1, now);
          else showText('Game over =(', 0.1, now);
          lost = true;
          lostTime = now;
          deathSound.play();
        }
      }
    };

    const moveGhost = (function () {
      const previousPosition = new THREE.Vector3();
      const currentPosition = new THREE.Vector3();
      const leftTurn = new THREE.Vector3();
      const rightTurn = new THREE.Vector3();

      return function (ghost, delta) {
        previousPosition
          .copy(ghost.position)
          .addScaledVector(ghost.direction, 0.5)
          .round();
        ghost.translateOnAxis(ghost.direction, delta * ghostSpeed);
        currentPosition
          .copy(ghost.position)
          .addScaledVector(ghost.direction, 0.5)
          .round();

        // If the ghost is transitioning from one cell to the next, see if they can turn.
        if (!currentPosition.equals(previousPosition)) {
          leftTurn.copy(ghost.direction).applyAxisAngle(UP, Math.PI / 2);
          rightTurn.copy(ghost.direction).applyAxisAngle(UP, -Math.PI / 2);

          const forwardWall = isWall(map, currentPosition);
          const leftWall = isWall(
            map,
            currentPosition.copy(ghost.position).add(leftTurn)
          );
          const rightWall = isWall(
            map,
            currentPosition.copy(ghost.position).add(rightTurn)
          );

          if (!leftWall || !rightWall) {
            // If the ghost can turn, randomly choose one of the possible turns.
            const possibleTurns = [];
            if (!forwardWall) possibleTurns.push(ghost.direction);
            if (!leftWall) possibleTurns.push(leftTurn);
            if (!rightWall) possibleTurns.push(rightTurn);

            if (possibleTurns.length === 0)
              throw new Error('A ghost got stuck!');

            const newDirection =
              possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
            ghost.direction.copy(newDirection);
            ghost.position.round().addScaledVector(ghost.direction, delta);
          }
        }
      };
    })();

    // Main game loop
    animationLoop(function (delta, now) {
      update(delta, now);

      // Render main view
      renderer.setViewport(
        0,
        0,
        renderer.domElement.width,
        renderer.domElement.height
      );
      renderer.render(scene, camera);

      // Render HUD
      renderHud(renderer, hudCamera, scene);
    });
  };

  main();
})();
