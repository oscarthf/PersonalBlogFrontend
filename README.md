# PersonalBlogFrontend

### About
#### This is the repository for the frontend of my personal blog (https://github.com/oscarthf/PersonalBlog). Anyone can use this code to create their own website.

## Stack:

```
WebGL for background animation
```

## To do:

```
0. Add widescreen initial positions for rocks.
1. Add particle sprite animation.
2. Fix particle path visible when respawning.
3. Add background textures.
4. Add sun animation.
5. Add moon animation.
6. Improve particle sprites.
```

## Environment Variables needed:

```
VITE_API_BASE_URL="/api"
```

## To create .env file

```
0. Create a blank text file called ".env" with no other extension.
1. Copy the above environment variables and remove the place holders.
2. Follow the steps bellow to obtain the above environment variables.
```

## For Local Deployment (With Docker):

```
0. Clone this repo using the command:
    git clone https://github.com/oscarthf/PersonalBlogFrontend
1. Navigate to the root folder of the repo using the command:
    cd PersonalBlogFrontend
2. Build the container using the command:
    docker build -t personal-blog-frontend .
3. Run the container using the command:
    docker run -p 3000:3000 personal-blog-frontend
4. Open your browser and go to http://localhost:3000
```

## For Local Deployment (No Docker):

```
0. Clone this repo using the command:
    git clone https://github.com/oscarthf/PersonalBlogFrontend
1. Navigate to the root folder of the repo using the command:
    cd PersonalBlogFrontend
2. Install the dependencies using the command:
    npm install
3. Run the app using the command:
    npm run dev
4. Open your browser and go to http://localhost:3000
```

## Image sources:

```
moon.png: https://www.goodfreephotos.com/astrophotography/close-up-of-the-moon-detail.jpg.php
opal.png: https://www.publicdomainpictures.net/en/view-image.php?image=627379&picture=opal-gemstone-stone-clipart-png
```