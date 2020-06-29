//全局变量
var gl;            //webgl上下文(由于requestAnimFrame(render)要求render为无参函数，因此将WebGL上下文gl)
var MaxNumSquares = 10000;  //最多支持1000个正方形
var MaxNumVertices = MaxNumSquares *12;  //顶点数，每个正方形含两个三角形，即6个顶点
var HalfSize = 5.0;   //正方形边长的一半
var count = 0;    //正方形数目
var canvas;


//页面加载完成后会调用此函数，函数名任意（不一定为main，可以为匿名函数）
window.onload=function main(){
	

	
	//获取页面中id为webgl的canvas元素
	canvas=document.getElementById("webgl");
	if(!canvas){
		alert("获取canvas元素失败");
		return;
	}	
	
	/*利用辅助文件中的功能获取WebGL上下文*/
	//成功则后面可通过gl来调用WebGL的函数
	gl=WebGLUtils.setupWebGL(canvas);
	if(!gl){
		alert("获取WebGL上下文失败！");
		return;
	}
	
	
	//--------------------------------------------------------------------

	
	
	//-----------------------------------------------------------------------
	
	//设置web相关属性
	//设置视口（此处视口占满整个canvas）
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clearColor(0,0.1,0.9,0.2);   //视口背景色设置
	
	/*记载shader程序并为shader中的attribute变量提供数据*/
	//加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	//并进行编译和链接，返回shader程序对象program
	var program=initShaders(gl,"vertex-shader","fragment-shader");
	gl.useProgram(program);  //启用该shader程序对象
	
	/*将顶点属性对象传给GPU*/
	//创建buffer
	var dataBufferId=gl.createBuffer(); 
	//将id为bufferId的buffer绑定为当前Array Buffer
	gl.bindBuffer(gl.ARRAY_BUFFER,dataBufferId);
	//为当前Array Buffer提供数据，传到GPU
	gl.bufferData(gl.ARRAY_BUFFER,    //buffer类型
		Float32Array. BYTES_PER_ELEMENT * 6 * MaxNumVertices,      //buffer数据来源，flatten将vertices转换为GPU可接受的格式
		gl.STATIC_DRAW);             //表明将如何使用buffer（STATIC_DRAW表明是一次提供数据，多遍绘制）
	
	
	/*为shader属性变量与buffer数据建立关联*/
	//获取名称为"a_Position"的shader attribute变量的位置
	var a_Position=gl.getAttribLocation(program,"a_Position");
	if(a_Position<0){
		alert("获得attribute变量a_Position失败！");
		return ;
	}
	
	//console.log("a_Position=%d",a_Position);  //后台输出数据，用于调试
	
	//指定利用当前Array Buffer为a_Position提供数据的具体方式
	gl.vertexAttribPointer(a_Position,  //shader arraybute变量位置
		3,  //每个顶点属性有3个分量
		gl.FLOAT,   //数组数据类型为浮点型
		false,      //不进行归一化处理
		Float32Array. BYTES_PER_ELEMENT * 6,          //相邻顶点属性地址相差0个字节
		0);         //第一个顶点属性在buffer中偏移量为0字节
	
	gl.enableVertexAttribArray(a_Position); //启用顶点属性数组
	
	
	
	
	/*为shader属性变量与buffer数据建立关联*/
	//获取名称为"a_Color"的shader attribute变量的位置
	var a_Color=gl.getAttribLocation(program,"a_Color");
	
	if(a_Color<0){
		alert("获得attribute变量a_Position失败！");
		return ;
	}
	
	//console.log("a_Color=%d",a_Color);  //后台输出数据，用于调试
	
	//指定利用当前Array Buffer为a_Position提供数据的具体方式
	gl.vertexAttribPointer(a_Color,  //shader arraybute变量位置
		3,  //每个顶点属性有3个分量(vec3)
		gl.FLOAT,   //数组数据类型为浮点型
		false,      //不进行归一化处理
		Float32Array. BYTES_PER_ELEMENT * 6,          //相邻顶点属性地址相差0个字节
		Float32Array. BYTES_PER_ELEMENT * 3);         //第一个顶点属性在buffer中偏移量为0字节
	
	gl.enableVertexAttribArray(a_Color); //启用顶点属性数组	
	
	//vertexAttribPointer的后两个参数，这里采用的是坐标和颜色交替存放的形式。

	//---------------------------------------------------------------------------------
	
	//获取uniform变量u_matMVP的位置
	var u_matMVP = gl.getUniformLocation(program,"u_matMVP");
	if(!u_matMVP){
		alert("获取uniform变量u_matMVP失败！");
	}
	//指定视域体和投影方式（正交投影），返回投影矩阵
	var matProj = ortho2D(0,canvas.width,0,canvas.height);
	//为uniform变量u_matMVP传值
	gl.uniformMatrix4fv(u_matMVP,false,flatten(matProj));
	
	
	//为canvas添加鼠标键移动事件监听器
	canvas.onmousemove = function(){
		movefish(event.clientX,event.clientY);
	}

	//为canvas添加点击事件监听器
	canvas.onmousedown = function(){
		addfish(event.clientX,event.clientY);
	};

	
	

	//用背景色擦除窗口内容
	gl.clear(gl.COLOR_BUFFER_BIT);  
	
	
};
//-----------------------------------------------------------------------------


var v;
var color_save=vec3(0.0,0.0,0.0);
var original2_X=0;
function render2(){
	render();
	
	//使用顶点数组进行绘制
	gl.drawArrays(gl.TRIANGLES,    //绘制图元类型为点
		0,          //从第0个顶点开始绘制
		21);         //使用顶点的个数

	//requestAnimFrame(render2);
	
};

function movefish(x,y){
	
	//获取canvas在页面窗口坐标系下的矩形
	var rect = canvas.getBoundingClientRect();
	//从页面客户区窗口坐标转换为webgl建模坐标
	x = x-rect.left;
	y = canvas.height - (y-rect.top);
	
	//顶点数据（须和颜色数据一样是三维的）
	
	var vertices1 = [
		vec3(x , y , 0),vec3(x-10 , y+8 , 0), vec3(x , y+20 , 0), 
		vec3(x , y , 0),vec3(x-10 , y-8 , 0), vec3(x , y-20 , 0),
		vec3(x , y , 0),vec3(x , y+20 , 0), vec3(x+15 , y+20 , 0), 
		vec3(x , y , 0),vec3(x , y-20 , 0), vec3(x+15 , y+20 , 0),
		vec3(x+15 , y+20 , 0),vec3(x , y-20 , 0), vec3(x+15 , y-20 , 0), 
		vec3(x+15 , y-20 , 0), vec3(x+15 , y+20 , 0),vec3(x+30 , y , 0),
		vec3(x+30 , y , 0),vec3(x+40 , y-13 , 0),vec3(x+40 , y+13 , 0),   

	];
	
	var vertices2 = [
		vec3(x , y , 0),vec3(x+10 , y+8 , 0), vec3(x , y+20 , 0), 
		vec3(x , y , 0),vec3(x+10 , y-8 , 0), vec3(x , y-20 , 0),
		vec3(x , y , 0),vec3(x , y+20 , 0), vec3(x-15 , y+20 , 0), 
		vec3(x , y , 0),vec3(x , y-20 , 0), vec3(x-15 , y+20 , 0),
		vec3(x-15 , y+20 , 0),vec3(x , y-20 , 0), vec3(x-15 , y-20 , 0), 
		vec3(x-15 , y-20 , 0), vec3(x-15 , y+20 , 0),vec3(x-30 , y , 0),
		vec3(x-30 , y , 0),vec3(x-40 , y-13 , 0),vec3(x-40 , y+13 , 0),   
	];
	
	if(x-original2_X>=0){
		//console.log("R");
		v=vertices2;
	}
	else if(x-original2_X<0){
		//console.log("L");
		v=vertices1;
	}
	
	var randColor = vec3(Math.random(), Math.random(), Math.random());
	color_save=randColor;
	var pionts=[];
	for(var i = 0 ; i<21 ;i++){
		pionts.push(v[i]);
		pionts.push(randColor);
	}
	v.length = 0;    //清空vertices数据
	
	//加载顶点位置数据（包含坐标和颜色）
	gl.bufferSubData(gl.ARRAY_BUFFER,
		0, //21*3*2*Float32Array.BYTES_PER_ELEMENT,  //偏移量
		flatten(pionts)
	);
	pionts.length=0;
	requestAnimFrame(render2);    //请求刷新显示
	
	original2_X = x;
}



//-----------------------------------------------------------------------------

//绘制函数
function render(){
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	if(count > 0){
		//使用顶点数组进行绘制
		gl.drawArrays(gl.TRIANGLES,    //绘制图元类型为点
			21,          //从第0个顶点开始绘制
			count*21);         //使用顶点的个数
	}
	
	//requestAnimFrame(render);
};


var original_X=0;
var vertices;
function addfish(x,y){
	if(count >= MaxNumSquares){   //到达上限不再添加
		alert("数目已到达上限！");
		return;
	}
	
	//original_X = x;
	
	
	//获取canvas在页面窗口坐标系下的矩形
	var rect = canvas.getBoundingClientRect();
	//从页面客户区窗口坐标转换为webgl建模坐标
	x = x-rect.left;
	y = canvas.height - (y-rect.top);
	
	//顶点数据（须和颜色数据一样是三维的）
	
	var vertices1 = [
		vec3(x , y , 0),vec3(x-10 , y+8 , 0), vec3(x , y+20 , 0), 
		vec3(x , y , 0),vec3(x-10 , y-8 , 0), vec3(x , y-20 , 0),
		vec3(x , y , 0),vec3(x , y+20 , 0), vec3(x+15 , y+20 , 0), 
		vec3(x , y , 0),vec3(x , y-20 , 0), vec3(x+15 , y+20 , 0),
		vec3(x+15 , y+20 , 0),vec3(x , y-20 , 0), vec3(x+15 , y-20 , 0), 
		vec3(x+15 , y-20 , 0), vec3(x+15 , y+20 , 0),vec3(x+30 , y , 0),
		vec3(x+30 , y , 0),vec3(x+40 , y-13 , 0),vec3(x+40 , y+13 , 0),   

	];
	
	var vertices2 = [
		vec3(x , y , 0),vec3(x+10 , y+8 , 0), vec3(x , y+20 , 0), 
		vec3(x , y , 0),vec3(x+10 , y-8 , 0), vec3(x , y-20 , 0),
		vec3(x , y , 0),vec3(x , y+20 , 0), vec3(x-15 , y+20 , 0), 
		vec3(x , y , 0),vec3(x , y-20 , 0), vec3(x-15 , y+20 , 0),
		vec3(x-15 , y+20 , 0),vec3(x , y-20 , 0), vec3(x-15 , y-20 , 0), 
		vec3(x-15 , y-20 , 0), vec3(x-15 , y+20 , 0),vec3(x-30 , y , 0),
		vec3(x-30 , y , 0),vec3(x-40 , y-13 , 0),vec3(x-40 , y+13 , 0),   
	];
	
	if(x-original_X>=0){
		//console.log("R");
		vertices=vertices2;
	}
	else if(x-original_X<0){
		//console.log("L");
		vertices=vertices1;
	}
	
	var randColor = color_save;

	var data = [];    //新坐标和颜色数据（交织在一起）
	for(var i = 0 ; i<21 ;i++){
		data.push(vertices[i]);
		data.push(randColor);
	}
	vertices.length = 0;    //清空vertices数据
	
	//加载顶点位置数据（包含坐标和颜色）
	gl.bufferSubData(gl.ARRAY_BUFFER,
		(count + 1)*21*3*2*Float32Array.BYTES_PER_ELEMENT,  //偏移量
		flatten(data)
	);
	data.length = 0;
	
	count++;
	requestAnimFrame(render);    //请求刷新显示

	
	original_X = x;
};


//-----------------------------------------------------




