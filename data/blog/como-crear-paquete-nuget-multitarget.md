---
title: Cómo crear y publicar un paquete Nuget multitarget.
date: '2023-02-12'
tags: ['.NET','Nuget']
draft: false
summary: El propósito de este artículo es crear un tutorial sobre cómo crear y publicar un paquete Nuget multitarget comentando particularidades y buenas prácticas en el proceso que he adquirido a base crear varios paquetes y trabajar con ellos en un entorno real.
---

## Cómo crear y publicar un paquete Nuget multitarget.

El propósito de este artículo es crear un tutorial sobre cómo crear y publicar un paquete Nuget multitarget comentando particularidades y buenas prácticas en el proceso que he adquirido a base crear varios paquetes y trabajar con ellos en un entorno real.

**El objetivo del Nuget multitarget es compartir código entre soluciones que estén basadas en .NET Framework “Classic” (.NET 4.6.2, .NET 4.7.2, .NET 4.8) y versiones posteriores del Framework (.NET Core, .NET 5, etc).**

Doy por hecho que el lector ya tiene conocimientos de lo que es un Nuget por lo que omitiré esta información en el artículo, de no ser así dejo aquí un recurso por donde empezar a investigar:
•	https://learn.microsoft.com/es-es/nuget/what-is-nuget

### Cosas a tener en cuenta antes de crear un Nuget multitarget.

La versión del framework que usaremos para crear el paquete será .NET Stardard (https://learn.microsoft.com/es-es/dotnet/standard/net-standard?tabs=net-standard-1-0). .NET Standard es una versión del .NET que se creó con la finalidad de unificar un poco el ecosistema. Una librería que use .NET Standard podrá ser usada desde un proyecto en .NET Framework 4.6.2 o en un proyecto .NET 5 sin diferencia alguna.

Si en tu proyecto no tienes la necesidad de dar soporte a aplicaciones en .NET Framework “Classic” (.NET 4.6.2, .NET 4.7.2, .NET 4.8) debes saber que no necesitas crear tus paquetes apuntando a .NET Standard. Desde la versión .NET 5 los Nugets deberían de ser compatibles con las versiones posteriores.

**Lo más importante antes de crear un Nuget es saber que no podemos crear un paquete que tenga una dependencia con un runtime especifico.** Por ejemplo, no podremos crear un paquete que tenga como dependencia Entity Framework, ya que, para .NET Framework 4.6 la versión de la librería que necesitamos sería la EF6 y para .NET 5 la versión que necesitaríamos sería EF Core. Si creásemos el paquete apuntando a EF6 funcionaría correctamente cuando usemos la librería en un proyecto de .NET Framework 4.6 pero tendríamos un problema cuando intentemos usar el paquete en un proyecto de .NET 5.

### Classic csproj style VS SDK-Style.

Toda librería de .NET tiene un archivo con extensión .csproj en la raíz. El archivo almacena información sobre los recursos necesarios y la configuración utilizada durante la compilación.

Este archivo de configuración lo puedes definir en dos formatos, la forma clásica y el SDK-Style. 

El formato clásico usa XML para definir la estructura del archivo y tiene la siguiente pinta:


``
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <Import Pro-ject="$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props" Condi-tion="Exists('$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props')" />
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
    <DebugSymbols>true</DebugSymbols>
    <DebugType>full</DebugType>
    <Optimize>false</Optimize>
    <OutputPath>bin\Debug\</OutputPath>
    <DefineConstants>DEBUG;TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Re-lease|AnyCPU' ">
    <DebugType>pdbonly</DebugType>
    <Optimize>true</Optimize>
    <OutputPath>bin\Release\</OutputPath>
    <DefineConstants>TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
  </PropertyGroup>
  <PropertyGroup>
    <SignAssembly>false</SignAssembly>
  </PropertyGroup>
  <PropertyGroup>
    <AssemblyOriginatorKeyFile>
    </AssemblyOriginatorKeyFile>
  </PropertyGroup>
  <ItemGroup>
    <Reference Include="System" />
    <Reference Include="System.Configuration" />
    <Reference Include="System.Core" />
  </ItemGroup>
  <ItemGroup>
    <Compile Include="Class1.cs" />
    <Compile Include="Class2.cs" />
    …..
  </ItemGroup>
  <ItemGroup>
     <PackageReference Include="Microsoft.CSharp" Version="4.7.0" />
  </ItemGroup>
  <Import Project="$(MSBuildToolsPath)\Microsoft.CSharp.targets" />
</Project>
``

El formato SDK-Style tiene la siguiente pinta:

``
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net462</TargetFrameworks>
    <PackageRequireLicenseAcceptance>false</PackageRequireLicenseAcceptance>
    <OutputType>Library</OutputType>
    <RootNamespace>Namespace</RootNamespace>
    <AssemblyName>Namespace</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.CSharp" Version="4.7.0" />
  </ItemGroup>
</Project>
``

Cómo se puede observar SDK-Style es mucho más limpio y simple ya que aplica un principio de diseño mucho mejor, por defecto todos los archivos del proyecto se incluyen en la compilación a diferencia del estilo clásico donde tienes que especificar explícitamente en el archivo .csproj que archivos conforman tu librería.

Sdk-Style está preparado para definir varios destinos de MSBuild por lo que a la hora de crear nuestro paquete multitarget nos será muy sencillo especificar varias versiones de Framework.

### Estructura de un paquete.

Para transformar una librería .NET a un paquete Nuget simplemente hay que incluir unas etiquetas en el archivo .csproj. Estas etiquetas son las siguientes:

•	**TargetFrameworks:** Versiones en las que se compilará el proyecto, pueden ser N.
•	**PackageId:** Identificador del paquete.
•	**PackageVersion:** versión del paquete
•	**Authors:** Autor del paquete
•	**Description:** descripción del paquete
•	**PackageReleaseNotes:** Notas donde se reflejan los cambios entre versiones del paquete. La idea es mantener un historial de qué cambios se han hecho entre versión y versión.
•	**Copyright:** Copyright
•	**PackageTags:** Tags, útil para filtrar en el repositorio de paquetes.
•	**FileVersion:** versión del fichero 
•	**AssemblyVersion:** versión del ensamblando.

Todas estas nuevas etiquetas las incluiremos dentro de la primera etiqueta PropertyGroup del .csproj.

``
<PropertyGroup>
    <TargetFrameworks>netstandard2.0;net462;net472;net5.0</TargetFrameworks>
    <PackageId>BusinessName.Common.Utils</PackageId>
    <PackageVersion>1.0.0</PackageVersion>
    <Title>BusinessName.Common.Utils </Title>
    <Authors>Nakerdev</Authors>
    <PackageRequireLicenseAcceptance>false</PackageRequireLicenseAcceptance>
    <Description>Utilities lib</Description>
    <PackageReleaseNotes>
        1.0.0
        - Initial version
    </PackageReleaseNotes>
    <Copyright>My copy</Copyright>
    <PackageTags>common dll</PackageTags>
    <OutputType>Library</OutputType>
    <RootNamespace>BusinessName.Common.Utils</RootNamespace>
    <AssemblyName>BusinessName.Common.Utils</AssemblyName>
    <FileVersion>1.0.0.0</FileVersion>
    <AssemblyVersion>1.0.0.0</AssemblyVersion>
    <GenerateAssemblyInfo>false</GenerateAssemblyInfo>
  </PropertyGroup>
``

Nótese que ya en este punto estamos definiendo varias versiones del framework en la etiqueta TargetFrameworks. A la hora de compilar el MSBuild creará el paquete de tal forma que sea compatible para todas las versiones que nosotros le especifiquemos. En este caso: netstandard2.0;net462;net472;net5.0

### Versionado de un paquete.

Hay distintas formas de versionar un paquete, yo recomiendo la que explica Microsoft https://learn.microsoft.com/es-es/nuget/concepts/package-versioning.

Básicamente nuestra versión constará de tres partes:

1.12.4 -> [Versión principal].[Versión secundaría].[Revisión]

•	Versión principal: Cambios importantes, no retro compatibles con versiones anteriores
•	Versión secundaría: Nuevas características, compatibles con versiones anteriores.
•	Revisión: Correcciones de errores, compatibles con versiones anteriores.

A la hora de trabajar con paquetes debemos tener en cuenta que no podemos hacer cambios que rompan la API que expone el paquete ya que los proyectos que lo usan se romperán cuando actualicen la versión. No obstante, hay veces que no queda otro remedio que romper la retrocompatibilidad para poder dar solución al problema que tenemos, en estos casos incrementaremos el primer número de nuestra versión que dará consciencia a las programadoras que usen la librería de que los cambios nos son retro compatibles y necesitaran hacer cambios en su código.

Todos los cambios de versión serán reflejados en las etiquetas PackageVersion y FileVersion de nuestro .csproj pero la etiqueta AssemblyVersion solo cambiará cuando subamos de versión principal a nuestro paquete. Ejemplo:

``
<PackageVersion>1.12.3</PackageVersion>
<FileVersion>1.12.3.0</FileVersion>
<AssemblyVersion>1.0.0.0</AssemblyVersion>

<PackageVersion>2.0.1</PackageVersion>
<FileVersion>2.0.1.0</FileVersion>
<AssemblyVersion>2.0.0.0</AssemblyVersion>
``

### Publicación de un paquete.

Una vez tenemos el código listo y la configuración del paquete creada solo queda publicarlo. Si el paquete es para uso interno de una empresa se puede usar un gestor de paquetes como Proget (https://inedo.com/proget) , si el paquete puede ser público lo publicaremos directamente sobre https://www.nuget.org/ 

Para publicarlos necesitaremos la CLI de Nuget, que las puedes encontrar aquí: https://www.nuget.org/downloads

Ya solo queda compilar el proyecto. Si el paquete es publico te recomiendo que publiques el paquete habiéndolo compilado en modo Release. Si usas un gestor de paquetes interno puedes tener dos feeds, uno para las versiones en Debug y otro para las versiones en Release. Esto te ayudará en el proceso de desarrollo, si tienes algún error podrás depurar el paquete sin problemas al estar usando una versión compilada en Debug. 

Obviamente, cuando el proyecto se prepare para su compilación en Release debemos restaurar los paquetes usando las versiones de Release de nuestras librerías. En mi experiencia esto lo hemos hecho en nuestros entornos de CI. Mientras que en el entorno local usamos el feed de paquetes Debug cuando las aplicaciones pasan al entorno de CI se restauran los paquetes usando el feed de Release.

Una vez el proyecto ha compilado tendremos que ejecutar los siguientes comandos usando la CLI de Nuget.

``
# Release
$NUGET_HOME/nuget.exe pack *.csproj -Prop Configuration=Release
$NUGET_HOME/nuget.exe push *.nupkg User:Pass -Verbosity detailed -Source https://proget.ci /nuget/Release/

# Debug
$NUGET_HOME/nuget.exe pack *.csproj -Symbols
$NUGET_HOME/nuget.exe push *[0-9].nupkg User:Pass -Verbosity detailed -Source https://proget.ci /nuget/Debug /
$NUGET_HOME/nuget.exe push *.symbols.nupkg User:Pass -Verbosity detailed - https://proget.ci /nuget/Debug /
``

Listo, ya tendrás tu paquete listo para usar.

Gracias por leer, espero que te haya ayudado.
Un saludo.
