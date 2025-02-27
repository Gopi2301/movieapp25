import {useEffect, useState} from 'react'

import './App.css'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const App =()=>{
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [movielists, setMovielists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [trendingMovies, setTrendingMovies] = useState([]);
    // debounce search term to limit the number of api calls
    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const API_BASE_URL = 'https://api.themoviedb.org/3'
    const API_KEY = import.meta.env.VITE_TMDB_KEY;
    const API_OPTIONS = {
        method: 'GET',
        headers:{
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    }

    const fetchMovies = async (query= '') => {
       setIsLoading(true);
       setError("");
        try{
           const endpoint = query ?
               `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`
               :  `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
           const response = await fetch(endpoint, API_OPTIONS);
           if (!response.ok) {
               throw new Error('Failed to fetch movies');
           }
            const data = await response.json();
           if(response.data ==='False'){
               setError(data.Error || 'Something went wwith data');
               setMovielists([]);
               return;
           }
           setMovielists(data.results || []);
           if(query && data.results.length > 0){
                await updateSearchCount(query, data.results[0]);
           }
        }catch(e){
            console.log(`Error in fetchMovies ${e}`);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }


    const loadTrendingMovies = async()=>{
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (error) {
            console.error(`Error in loadTrendingMovies ${error}`);
        }
    }
// sideeffect to fetch movies while debounced search term changes
    useEffect(()=>{
        fetchMovies( debouncedSearchTerm);
    },[ debouncedSearchTerm]);
// sideeffect to fetch trending movies only once
    useEffect(()=>{
        loadTrendingMovies();
    },[]);


    return (
       <main>
           <div className="pattern" />
               <div className="wrapper">
                   <header>
                       <img src="./hero.png" alt="hero bg"/>
                       <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy without the Hassle</h1>
                       <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                   </header>
                   {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index)=> (
                                <li key={movie.$id}>
                                    <p>{index +1 }</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    </section>
                   )}
                    <section className="all-movies">
                        <h2>All Movies</h2>
                        {isLoading ? (<Spinner />
                        ) : error ? (<p className="text-white">{error}</p>
                        ): (
                            <ul >
                                {movielists.map((movie)=>(
                                   <MovieCard key={movie.id} movie={movie}/>
                                ))}
                            </ul>
                        )

                        }
                    </section>
               </div>
       </main>
    )
}
export default App
