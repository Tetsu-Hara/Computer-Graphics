//绘制时采用的4种颜色
var colors=[
	vec3(1.0,0.0,0.0),   //r
	vec3(0.0,1.0,0.0),   //g
	vec3(0.0,0.0,1.0),   //b
	vec3(0.0,0.0,0.0)   //black
];
var attributes=[];   //存放顶点属性数组（坐标和颜色交替存）初始为空

var NumTimesToSubdivide=4;   //递归次数
var NumTetrahedrons=Math.pow(4,NumTimesToSubdivide);  //产生的四面体个数(4的递归次数的幂)
var NumTriangles=4*NumTetrahedrons;  //产生的三角形个数（每个四面体有4个三角形）
var NumVertices=3*NumTriangles;   //顶点数（三角形三个顶点*三角形个数）
//var points=[];   //存放顶点坐标数组，初始为空


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

	
	//指定初始正四面体（裁剪坐标系z轴朝屏幕内）
	var vertices=[
		vec3(0.0,0.0,-1.0),                     //前方中心点
		vec3(0.0,0.942809,-0.333333),           //底面上方
		vec3(-0.816497,-0.471405,-0.333333),	//底面左下点
		vec3(0.816497,-0.471405,-0.333333),		//底面右下点
	];
	
	
	//递归细分原始三角形
	divideTetra(vertices[0],vertices[1],vertices[2],vertices[3],NumTimesToSubdivide);
	
	
	
	//设置web相关属性
	//设置视口（此处视口占满整个canvas）
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.clearColor(1.0,1.0,1.0,1.0);   //视口背景色设置
	
	gl.enable(gl.DEPTH_TEST);   //开启深度检测
	//gl.enable(gl.CULL_FACE);	// 开启面剔除（默认剔除背面）
	
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
		flatten(attributes),            //buffer数据来源，flatten将vertices转换为GPU可接受的格式
		gl.STATIC_DRAW);             //表明将如何使用buffer（STATIC_DRAW表明是一次提供数据，多遍绘制）
	
	attributes.length=0; //数据已传到cpu，内存中数据已经可以清空了
	
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
		Float32Array.BYTES_PER_ELEMENT*6,          //相邻顶点属性首址间隔
		0);         //第一个顶点属性在buffer中偏移量为0字节
	
	gl.enableVertexAttribArray(a_Position); //启用顶点属性数组
	
	

	/*将颜色属性对象传给GPU*/
	var colorBufferId=gl.createBuffer(); //创建buffer
	
	//将id为bufferId的buffer绑定为当前Array Buffer
	//gl.bindBuffer(gl.ARRAY_BUFFER,colorBufferId);
	
	//为当前Array Buffer提供数据，传到GPU
	//gl.bufferData(gl.ARRAY_BUFFER,    //buffer类型
	//	flatten(colors),            //buffer数据来源，flatten将vertices转换为GPU可接受的格式
	//	gl.STATIC_DRAW);             //表明将如何使用buffer（STATIC_DRAW表明是一次提供数据，多遍绘制）
	
	
	/*为shader属性变量与buffer数据建立关联*/
	//获取名称为"a_Color"的shader attribute变量的位置
	var a_Color=gl.getAttribLocation(program,"a_Color");
	
	if(a_Color<0){
		alert("获得attribute变量a_Color失败！");
		return ;
	}
	
	//console.log("a_Color=%d",a_Color);  //后台输出数据，用于调试
	
	//指定利用当前Array Buffer为a_Position提供数据的具体方式
	gl.vertexAttribPointer(a_Color,  //shader arraybute变量位置
		3,  //每个顶点属性有3个分量(vec3)
		gl.FLOAT,   //数组数据类型为浮点型
		false,      //不进行归一化处理
		Float32Array.BYTES_PER_ELEMENT*6,          //相邻顶点属性地址相差0个字节
		Float32Array.BYTES_PER_ELEMENT*3);         //第一个顶点属性在buffer中偏移量为0字节
	
	gl.enableVertexAttribArray(a_Color); //启用顶点属性数组	

	
	//进行绘制
	render(gl);
	
	
	
	
};


//绘制函数
function render(gl){
	
	//清空颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//使用顶点数组进行绘制
	gl.drawArrays(gl.TRIANGLES,    //绘制图元类型为三角形
		0,          //从第0个顶点开始绘制
		NumVertices);         //使用顶点的个数等于顶点数组的长度
		   
}



//将三角形的顶点坐标加入数组中
//a,b,c为三角形的三个顶点坐标
//colorIndex为colors数组的索引
//三个顶点的颜色均设为colors[colorIndex]
//顶点坐标颜色交替存
function triangle(a,b,c,colorIndex){
	attributes.push(a);
	attributes.push(colors[colorIndex]);
	attributes.push(b);
	attributes.push(colors[colorIndex]);
	attributes.push(c);
	attributes.push(colors[colorIndex]);
}


//生成四面体，参数为四个面顶点
function tetra(a,b,c,d){
	triangle(a,b,c,0);   //红色三角形
	triangle(a,c,d,1);   //绿色三角形
	triangle(a,d,b,2);   //蓝色三角形
	triangle(b,d,c,3);   //黑色三角形
}


//体细分
//a,b,c,d为四面体的四个顶点，k为递归次数
function divideTetra(a,b,c,d,k){
	//基于顶点的数量对三角形进行细分
	var mid=[];
	if(k>0){
		//计算各边的中点
		mid[0] = mult(0.5,add(a,b));
		mid[1] = mult(0.5,add(a,c));
		mid[2] = mult(0.5,add(a,d));
		mid[3] = mult(0.5,add(b,c));
		mid[4] = mult(0.5,add(c,d));
		mid[5] = mult(0.5,add(b,d));
		
		//通过细分生成4个四面体
		divideTetra(a,mid[0],mid[1],mid[2],k-1);
		divideTetra(mid[0],b,mid[3],mid[5],k-1);
		divideTetra(mid[1],mid[3],c,mid[4],k-1);
		divideTetra(mid[2],mid[5],mid[4],d,k-1);

	}
	else{
		tetra(a,b,c,d);   //递归结束时添加四面体顶点数据
	}
}













