
const imageUpload = document.getElementById('imageUpload')
const predictButton = document.getElementById('predictButton')
let predictedAges = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("../models"),
  faceapi.nets.faceRecognitionNet.loadFromUri('../models'),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri('../models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('../models'),
  faceapi.nets.faceExpressionNet.loadFromUri("../models"),
  faceapi.nets.ageGenderNet.loadFromUri("../models")
]).then(start)

function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}

async function start() {
    const useTinyModel = true
    const container = document.createElement('div')
    container.style.position = 'relative'
    container.style.width = '100%'

    document.body.append(container)
    let image
    let canvas
    
    imageUpload.addEventListener('change', async () => {
        await makePrediction(imageUpload.files[0])
    })
    predictButton.addEventListener('click', async () => {
        var res = await fetch('./test.jpg')
        var blob = await res.blob()
        await makePrediction(blob)
    })


    async function makePrediction(img) {
        if (image) image.remove()
        if (canvas) canvas.remove()
        image = await faceapi.bufferToImage(img)
        image.style.objectFit = 'cover'
        image.style.width = '100%'
        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        canvas.style = 'position: absolute; top: 0; left: 0'
        container.append(canvas)
        const displaySize = { width: image.width, height: image.height }
        faceapi.matchDimensions(canvas, displaySize)
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks(useTinyModel).withFaceExpressions().withAgeAndGender()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        resizedDetections.forEach((result, i) => {
        const box = resizedDetections[i].detection.box
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        const age = resizedDetections[0].age;
        const interpolatedAge = interpolateAgePredictions(age);
        const bottomRight = {
            x: resizedDetections[0].detection.box.topRight.x - 50,
            y: resizedDetections[0].detection.box.topRight.y - 23
        };
    
        new faceapi.draw.DrawTextField(
            [`${Math.round(interpolatedAge)} years`],
            bottomRight
        ).draw(canvas);
        })
    }
}