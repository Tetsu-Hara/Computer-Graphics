
var NumTimesToSubdivide=5;   //递归次数
var NumTrianhles=Math.pow(3,NumTimesToSubdivide);  //产生三角形的个数(3的递归次数的幂)
var NumVertices=3*NumTrianhles;   //顶点数
var points=[];   //存放顶点坐标数组，初始为空

//页面加载完成后会调用此函数，函数名任意（不一定为main，可以为匿名函数）
window.onload=function main(){
	
	//获取页面中id为webgl的canvas元素
	var canvas=document.getElementById("webgl");
	if(!canvas){
		alert("获取canvas元素失败");
		return;
	}	
	
	/*利用辅助文件中的功能获取WebGL上下文*/
	//成功则后面可通过gl来调用WebGL的函数
	var gl=WebGLUtils.setupWebGL(canvas);
	if(!gl){
		alert("获取WebGL上下文失败！");
		return;
	}

	
	//指定三角形三个顶点
	var vertices=[
		vec2(-1.0,-1.0),vec2(0.0,1.0),vec2(1.0,-1.0)
	];
	
	
	//递归细分原始三角形
	divideTriangle(vertices[0],vertices[1],vertices[2],NumTimesToSubdivide);
	
	
	
	//设置web相关属性
	//设置视口（此处视口占满整个canvas）
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clearColor(1.0,1.0,1.0,1.0);   //视口背景色设置
	
	/*记载shader程序并为shader中的attribute变量提供数据*/
	//加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	//并进行编译和链接，返回shader程序对象program
	
	var program=initShaders(gl,"vertex-shader","fragment-shader");
	gl.useProgram(program);  //启用该shader程序对象
	
	/*将顶点属性对象传给GPU*/
	var verticesbufferId=gl.createBuffer(); //创建buffer
	
	//将id为bufferId的buffer绑定为当前Array Buffer
	gl.bindBuffer(gl.ARRAY_BUFFER,verticesbufferId);
	
	//为当前Array Buffer提供数据，传到GPU
	gl.bufferData(gl.ARRAY_BUFFER,    //buffer类型
		flatten(points),            //buffer数据来源，flatten将vertices转换为GPU可接受的格式
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
		2,  //每个顶点属性有2个分量
		gl.FLOAT,   //数组数据类型为浮点型
		false,      //不进行归一化处理
		0,          //相邻顶点属性地址相差0个字节
		0);         //第一个顶点属性在buffer中偏移量为0字节
	
	gl.enableVertexAttribArray(a_Position); //启用顶点属性数组
	
	

	///*将颜色属性对象传给GPU*/
	//var colorBufferId=gl.createBuffer(); //创建buffer
	
	////将id为bufferId的buffer绑定为当前Array Buffer
	//gl.bindBuffer(gl.ARRAY_BUFFER,colorBufferId);
	
	////为当前Array Buffer提供数据，传到GPU
	//gl.bufferData(gl.ARRAY_BUFFER,    //buffer类型
	//	flatten(colors),            //buffer数据来源，flatten将vertices转换为GPU可接受的格式
	//	gl.STATIC_DRAW);             //表明将如何使用buffer（STATIC_DRAW表明是一次提供数据，多遍绘制）
	
	
	///*为shader属性变量与buffer数据建立关联*/
	////获取名称为"a_Color"的shader attribute变量的位置
	//var a_Color=gl.getAttribLocation(program,"a_Color");
	
	//if(a_Color<0){
	//	alert("获得attribute变量a_Position失败！");
	//	return ;
	//}
	
	////console.log("a_Color=%d",a_Color);  //后台输出数据，用于调试
	
	////指定利用当前Array Buffer为a_Position提供数据的具体方式
	//gl.vertexAttribPointer(a_Color,  //shader arraybute变量位置
	//	3,  //每个顶点属性有3个分量(vec3)
	//	gl.FLOAT,   //数组数据类型为浮点型
	//	false,      //不进行归一化处理
	//	0,          //相邻顶点属性地址相差0个字节
	//	0);         //第一个顶点属性在buffer中偏移量为0字节
	//
	//gl.enableVertexAttribArray(a_Color); //启用顶点属性数组	

	
	//进行绘制
	render(gl);
	
	
	
	
};


//绘制函数
function render(gl){
	
	//用背景色擦除窗口内容
	gl.clear(gl.COLOR_BUFFER_BIT);  
	
	//使用顶点数组进行绘制
	gl.drawArrays(gl.TRIANGLES,    //绘制图元类型为点
		0,          //从第0个顶点开始绘制
		NumVertices);         //使用顶点的个数等于顶点数组的长度
		   
}



//将三角形的顶点坐标加入数组中
//a,b,c为三角形的三个顶点坐标
function trangle(a,b,c){
	points.push(a);
	points.push(b);
	points.push(c);
}


//递归细分三角形
//k用于控制细分次数
function divideTriangle(a,b,c,k){
	if(k>0){
		/*计算三角形各边的中点*/
		var ab=mult(0.5,add(a,b));
		var ac=mult(0.5,add(a,c));
		var bc=mult(0.5,add(b,c));
		/*除了中间的那个三角形，继续细分其他三角形*/
		divideTriangle(a,ab,ac,k-1);
		divideTriangle(c,ac,bc,k-1);
		divideTriangle(b,bc,ab,k-1);
	}
	else{
		trangle(a,b,c);  //递归结束时“绘制”三角形
	}
	
}















