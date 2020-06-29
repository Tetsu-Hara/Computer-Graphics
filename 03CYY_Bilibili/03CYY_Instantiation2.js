// Instantiation.js

// 全局变量
var gl;				// WebGL上下文
var u_MVPMatrix;    // shader中uniform变量u_MVPMatrix的索引
var u_StartColor;   //shader中uniform变量u_StartColor的索引
var u_EndColor;     //shader中uniform变量u_EndColor的索引
var matProj;		// 投影矩阵，在main中赋值，在render中使用
var matMVP;         //模视投影矩阵

var nVertexCountPerSide = 50; // 正方形细分后每行顶点数
var nVertexCount = nVertexCountPerSide * nVertexCountPerSide;  // 一个面的顶点数
// 一个面的三角形数
var nTriangleCount = (nVertexCountPerSide - 1) * (nVertexCountPerSide - 1) * 2;
var nIndexCount = 3 * nTriangleCount; // 一个面的顶点索引数

//用于实现按键响应
var angleY = 0.0;       //绕Y轴旋转的角度
var angleX = 0.0;       //绕X轴旋转的角度
var angleStep = 3.0;       //角度变化步长（3度）

/*给3个长方体添加动画效果*/
//（对中间长方体实现伸缩动画，可以将y方向的缩放因子设为参数）
var yScale = 1;             //中间长方形y方向缩放因子
var scaleFactor = 1.1;      //yScale缩放系数

//上方长方体旋转
var thetaUpLeft = 20;          //左方长方形旋转角度
var deltaUpLeft = 30;         //左方长方形每秒旋转角度
var theta=0;

var downV = 10;   //下落速度
var downP = 25;   //下落位置

//按键响应
window.onkeydown = function(){
	
	switch(event.keyCode){
		case 37:   //方向键left
			angleY -= angleStep;
			if(angleY < -180.0){
				angleY +=360.0;
			}
			break;
		case 38:   //方向键up
			angleX -= angleStep;
			if(angleX < -80.0){
				angleX = -80.0;
			}
			break;
		case 39:   //方向键right
			angleY += angleStep;
			if(angleY > 180.0){
				angleY -=360.0;
			}
			break;
		case 40:   //方向键down
			angleX += angleStep;
			if(angleX > 80.0){
				angleX = 80.0;
			}
			break;
	}
	
};


// 页面加载完成后会调用此函数，函数名可任意(不一定为main)
window.onload = function main(){
	
	// 获取页面中id为webgl的canvas元素
    var canvas = document.getElementById("webgl");
	if(!canvas){ // 获取失败？
		alert("获取canvas元素失败！"); 
		return;
	}
	
	// 利用辅助程序文件中的功能获取WebGL上下文
	// 成功则后面可通过gl来调用WebGL的函数
    gl = WebGLUtils.setupWebGL(canvas);    
    if (!gl){ // 失败则弹出信息
		alert("获取WebGL上下文失败！"); 
		return;
	}        

	/*设置WebGL相关属性*/
	// 设置视口，占满整个canvas
    gl.clearColor(0.8, 0, 0.1, 0.2); // 设置背景色为白色
	gl.enable(gl.DEPTH_TEST);	// 开启深度检测
	gl.enable(gl.CULL_FACE);	// 开启面剔除，默认剔除背面
	gl.viewport(0, 0, canvas.width, canvas.height);
	// 设置投影矩阵：透视投影，根据视口宽高比指定视域体
	matProj = perspective(35.0, 		// 垂直方向视角
		canvas.width / canvas.height, 	// 视域体宽高比
		20.0, 							// 相机到近裁剪面距离
		100.0);							// 相机到远裁剪面距离
     
	/*初始化顶点坐标数据*/
	// 计算中心在原点的，位于z=0平面的，边长为1的正方形的所有顶点坐标
	var vertices = []; // 顶点坐标数组
	// x和y方向相邻顶点间距
	var step = 1.0 / (nVertexCountPerSide - 1);   
	var y = 0.5;  // 初始y坐标
	for (var i = 0; i < nVertexCountPerSide; i++) {
		var x = -0.5; // 初始x坐标
		for (var j = 0; j < nVertexCountPerSide; j++) {
			vertices.push(vec2(x, y));
			x += step;
		}
		y -= step;
	}
	
	/*索引数组*/
	var indexes = new Uint16Array(nIndexCount);
	var index = 0; // indexes数组下标
	var start = 0; // 初始索引
	for (var i = 0; i < nVertexCountPerSide - 1; i++) {
		for (var j = 0; j < nVertexCountPerSide - 1; j++) {
			// 添加构成一个小正方形的两个三角形的顶点索引
			indexes[index++] = start;
			indexes[index++] = start + nVertexCountPerSide;
			indexes[index++] = start + nVertexCountPerSide + 1;
			indexes[index++] = start;
			indexes[index++] = start + nVertexCountPerSide + 1;
			indexes[index++] = start + 1;
			start++;
		}
		start++;
	}

	/*创建并初始化一个缓冲区对象(Buffer Object)，用于存顶点坐标*/
    var verticesBufferId = gl.createBuffer(); // 创建buffer
	// 将id为verticesBufferId的buffer绑定为当前Array Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
	// 为当前Array Buffer提供数据，传输到GPU
    gl.bufferData(gl.ARRAY_BUFFER, 	 // Buffer类型
		flatten(vertices), // Buffer数据源
		gl.STATIC_DRAW );  // 表明是一次提供数据，多遍绘制

	/*创建并初始化一个缓冲区对象(Buffer Object)，用于存顶点索引序列*/
	var indexBufferId = gl.createBuffer(); // 创建buffer
	// 将id为indexBufferId的buffer绑定为当前Element Array Buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferId);
	// 为当前Element Array Buffer提供数据，传输到GPU
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 	 // Buffer类型
		indexes, // Buffer数据源
		gl.STATIC_DRAW ); // 表明是一次提供数据，多遍绘制
	
	/*加载shader程序并为shader中attribute变量提供数据*/
	// 加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	// 并进行编译和链接，返回shader程序对象program
    var program = initShaders(gl, "vertex-shader", 
		"fragment-shader");
    gl.useProgram(program);	// 启用该shader程序对象 
	
	/*初始化顶点着色器中的顶点位置属性*/
	// 获取名称为"a_Position"的shader attribute变量的位置
    var a_Position = gl.getAttribLocation(program, "a_Position");
	if(a_Position < 0){ // getAttribLocation获取失败则返回-1
		alert("获取attribute变量a_Position失败！"); 
		return;
	}	
	// 指定利用当前Array Buffer为a_Position提供数据的具体方式
    gl.vertexAttribPointer(a_Position, 	// shader attribute变量位置
		2, // 每个顶点属性有2个分量
		gl.FLOAT, // 数组数据类型(浮点型)
		false, 	  // 不进行归一化处理
		0,	 	  // 相邻顶点属性首址间隔(0为紧密排列) 
		0);		  // 第一个顶点属性在Buffer中偏移量
    gl.enableVertexAttribArray(a_Position);  // 启用顶点属性数组

	/*获取shader中uniform变量索引*/
	u_MVPMatrix = gl.getUniformLocation(program, "u_MVPMatrix");
	if(!u_MVPMatrix){
		alert("获取uniform变量u_MVPMatrix失败！")
		return;
	}
	
	var u_MaxDist = gl.getUniformLocation(program, "u_MaxDist");
	if(!u_MaxDist){
		alert("获取uniform变量u_MaxDist失败！")
		return;
	}
	
	u_StartColor = gl.getUniformLocation(program, "u_StartColor");
	if(!u_StartColor){
		alert("获取uniform变量u_StartColor失败！")
		return;
	}
	
	u_EndColor = gl.getUniformLocation(program, "u_EndColor");
	if(!u_EndColor){
		alert("获取uniform变量u_EndColor失败！")
		return;
	}
	
	/*u_MaxDist的值在整个程序执行过程中不变，
	  因此可在main中为其传值*/
	// 正方形内一点到正方形中心的最大距离
	gl.uniform1f(u_MaxDist, Math.sqrt(2.0) / 2); 
	
	// 进行绘制
    render();

};

// 记录上一次调用函数的时刻
var last = Date.now();


// 根据时间更新旋转角度
function animation(){
	// 计算距离上次调用经过多长的时间
	var now = Date.now();
	var elapsed = now - last; // 毫秒
	last = now;
	
	/*待添加修改动画相关参数代码*/
	//控制yScale在1到20之间
	if(yScale > 3){
		scaleFactor = 0.96;
	}
	if(yScale < 0.3){
		scaleFactor = 1.1;
	}
	yScale *= scaleFactor;

	
	//控制thetaUpLeft在30到45变换（左上）
	if(thetaUpLeft < 20){
		theta = 40-thetaUpLeft;
	}
	else{
		theta = thetaUpLeft;
	}
	if(thetaUpLeft>35)
		thetaUpLeft=5;
	thetaUpLeft += deltaUpLeft * elapsed/1000.0;
	
	//下落
	if(downP<-16){
		downV = 0;
	}
	else{
		downV += 0.1;
	}
	downP -= downV * elapsed/1000.0;
	
	
	angleY -= angleStep* elapsed/300.0;
		if(angleY < -180.0){
			angleY +=360.0;
		}
	
}

// 绘制函数
function render() {
	// 更新动画相关参数
	animation();
	
	// 清颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
	// 设置模视投影矩阵
	matMVP = matProj;	// 初始化为投影矩阵
	// 将后面的所有对象都往z轴负半轴移动60个单位，使得对象位于照相机的前方
	// (照相机在原点，面向z轴负半轴拍照)。
	// 这样后面在建模时z坐标范围须在(-40, 40)
	matMVP = mult(matMVP, translate(0.0, 0.0, -60.0));
	//增加按键控制相机视角的旋转变换
	matMVP = mult(matMVP, mult(rotateY(angleY),rotateX(angleX)));
	
	//右乘矩阵，放大正方形
	//matMVP = mult(matMVP, scale(15.0,15.0,15.0));
	
	/*实例化变换*/
	drawBilibili(0,3,-6);
	gl.uniform4f(u_StartColor,0,0.8,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,0,0.8,1,1);      //最外围颜色
	drawB(4);
	drawI(4);
	drawL(4);
	drawI2(4);
	
	gl.uniform4f(u_StartColor,1,0,0.1,0.6);    //中心点颜色
	gl.uniform4f(u_EndColor,1,0,0.1,0.6);      //最外围颜色
	drawB(20);
	drawI(20);
	drawL(20);
	drawI2(20);

	requestAnimFrame(render); // 请求重绘
};


function drawB(size){
	
	
	drawCube(mult(translate(-20+size,downP,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-20+size,downP+2,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-20+size,downP+4,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-20+size,downP+6,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-20+size,downP+8,-6),scale(2, 2, 2)));
	
	drawCube(mult(translate(-18+size,downP,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-18+size,downP+4,-6),scale(2, 2, 2)));
	
	drawCube(mult(translate(-16+size,downP,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-16+size,downP+2,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-16+size,downP+4,-6),scale(2, 2, 2)));

};
function drawI(size){
	
	drawCube(mult(translate(-13+size,downP+7.5,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-13+size,downP,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-13+size,downP+2,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-13+size,downP+4,-6),scale(2, 2, 2)));

};

function drawL(size){
	
	drawCube(mult(translate(-10+size,downP+8,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-10+size,downP+6,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-10+size,downP+4,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-10+size,downP+2,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-10+size,downP,-6),scale(2, 2, 2)));
	
	drawCube(mult(translate(-10+size,downP,-6),scale(2, 2, 2)));

};

function drawI2(size){
	
	drawCube(mult(translate(-7+size,downP+7.5,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-7+size,downP+4,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-7+size,downP+2,-6),scale(2, 2, 2)));
	drawCube(mult(translate(-7+size,downP,-6),scale(2, 2, 2)));

};

function drawBilibili(tx,ty,tz){
	
	
	/*实例化变换*/
	//外框
	gl.uniform4f(u_StartColor,0,0.8,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,0,0.8,1,1);      //最外围颜色
	drawCube(mult(translate(tx,ty,tz),scale(20, 14, 10))); 

	gl.uniform4f(u_StartColor,1,1,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,1,1,1,1);      //最外围颜色
	drawCube(mult(translate(tx,ty,tz),scale(16, 10, 10.1)));     
	
	//眼睛
	gl.uniform4f(u_StartColor,0,0.8,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,0,0.8,1,1);      //最外围颜色
	drawCube(mult(translate(tx,ty,tz),mult(translate(-3,0,0),scale(2.3, yScale, 10.2))));   

	gl.uniform4f(u_StartColor,0,0.8,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,0,0.8,1,1);      //最外围颜色
	drawCube(mult(translate(tx,ty,tz),mult(translate(3,0,0),scale(2.3, yScale, 10.2))));   
	
	//小电视天线
	gl.uniform4f(u_StartColor,0,0.8,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,0,0.8,1,1);      //最外围颜色
	drawCube(mult(translate(tx,ty,tz),mult(translate(-5,8,0),mult(rotateZ(theta),scale(2.5, 8, 5)))));  
	 
	
	gl.uniform4f(u_StartColor,0,0.8,1,1);    //中心点颜色
	gl.uniform4f(u_EndColor,0,0.8,1,1);      //最外围颜色
	drawCube(mult(translate(tx,ty,tz),mult(translate(5,8,0),mult(rotateZ(-theta),scale(2.5, 8, 5)))));  
	
};



/*因为要绘制3个立方体(通过变换将其变为长方体)
为了方便起见
将绘制立方体的代码封装成一个函数*/
function drawCube(matInstance){
	
	var matNew = mult(matMVP,matInstance);    //matNew：防止受之前正方形数据影响
	
	/*绘制前方面*/
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matNew,translate(0,0,0.5))));
	// 用索引数组绘制前方面
	gl.drawElements(
		gl.TRIANGLES, 		// 绘制图元类型
		nIndexCount,		// 顶点索引数
		gl.UNSIGNED_SHORT,	// 索引数组元素类型
		0			    	// 偏移量，从第0个顶点开始
	);
	
	/*绘制后方面*/
	gl.uniformMatrix4fv(u_MVPMatrix, false, 
		flatten(mult(matNew,mult(translate(0,0,-0.5),rotateX(180)))));
	// 用索引数组绘制前方面
	gl.drawElements(
		gl.TRIANGLES, 		// 绘制图元类型
		nIndexCount,		// 顶点索引数
		gl.UNSIGNED_SHORT,	// 索引数组元素类型
		0			    	// 偏移量，从第0个顶点开始
	);
	
	/*绘制左方面*/
	gl.uniformMatrix4fv(u_MVPMatrix, false, 
		flatten(mult(matNew,mult(translate(-0.5,0,0),rotateY(-90)))));
	// 用索引数组绘制前方面
	gl.drawElements(
		gl.TRIANGLES, 		// 绘制图元类型
		nIndexCount,		// 顶点索引数
		gl.UNSIGNED_SHORT,	// 索引数组元素类型
		0			    	// 偏移量，从第0个顶点开始
	);
	
	/*绘制右方面*/
	gl.uniformMatrix4fv(u_MVPMatrix, false, 
		flatten(mult(matNew,mult(translate(0.5,0,0),rotateY(90)))));
	// 用索引数组绘制前方面
	gl.drawElements(
		gl.TRIANGLES, 		// 绘制图元类型
		nIndexCount,		// 顶点索引数
		gl.UNSIGNED_SHORT,	// 索引数组元素类型
		0			    	// 偏移量，从第0个顶点开始
	);
	
	/*绘制上方面*/
	gl.uniformMatrix4fv(u_MVPMatrix, false, 
		flatten(mult(matNew,mult(translate(0,0.5,0),rotateX(-90)))));
	// 用索引数组绘制前方面
	gl.drawElements(
		gl.TRIANGLES, 		// 绘制图元类型
		nIndexCount,		// 顶点索引数
		gl.UNSIGNED_SHORT,	// 索引数组元素类型
		0			    	// 偏移量，从第0个顶点开始
	);
	
	/*绘制下方面*/
	gl.uniformMatrix4fv(u_MVPMatrix, false, 
		flatten(mult(matNew,mult(translate(0,-0.5,0),rotateX(90)))));
	// 用索引数组绘制前方面
	gl.drawElements(
		gl.TRIANGLES, 		// 绘制图元类型
		nIndexCount,		// 顶点索引数
		gl.UNSIGNED_SHORT,	// 索引数组元素类型
		0			    	// 偏移量，从第0个顶点开始
	);
	
}







