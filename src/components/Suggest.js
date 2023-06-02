import React, { useState, useEffect } from 'react';
import '../App.css';
import './Suggest.css';
import axios from 'axios';
import LazyLoad from 'react-lazyload';

function Suggest(props) {
  const [searchKey, setSearchKey] = useState('');
  const [tracks, setTracks] = useState([]);
  const [recommendedArtists, setRecommendedArtists] = useState([]);
  const [recommendedAlbums, setRecommendedAlbums] = useState([]);
  const [artistDetails, setArtistDetails] = useState([]);
  const [topSongs, setTopSongs] = useState([]);
  const [fadeTopSongs, setFadeTopSongs] = useState(false);

  const access_token = props.token;

  const searchArtist = async () => {
    const { data } = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      params: {
        q: searchKey,
        type: 'artist',
      },
    });

    const artistID = data.artists.items[0].id;

    const artistTracks = await axios.get(
      `https://api.spotify.com/v1/artists/${artistID}/top-tracks`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          limit: 10,
          market: 'US',
        },
      }
    );

    setTracks(artistTracks.data.tracks);

    const { data: recommendedArtistsData } = await axios.get(
      `https://api.spotify.com/v1/artists/${artistID}/related-artists`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    setRecommendedArtists(recommendedArtistsData.artists.slice(0, 5));

    const recommendedAlbumsData = await Promise.all(
      recommendedArtistsData.artists.slice(0, 5).map(async (relatedArtist) => {
        const { data: albumsData } = await axios.get(
          `https://api.spotify.com/v1/artists/${relatedArtist.id}/albums`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            params: {
              limit: 1,
            },
          }
        );
        return albumsData.items[0];
      })
    );

    setRecommendedAlbums(recommendedAlbumsData);
  };

  const getArtistDetails = async (artistID) => {
    try {
      const { data } = await axios.get(`https://api.spotify.com/v1/artists/${artistID}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      });

      return data;
    } catch (error) {
      console.error('Error fetching artist details:', error);
      return null;
    }
  };

  const fetchTopSongs = async () => {
    try {
      const { data } = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          limit: 10,
          time_range: 'short_term',
        },
      });

      const topSongsWithDetails = await Promise.all(
        data.items.map(async (song) => {
          const artistID = song.artists[0].id;
          const artistDetails = await getArtistDetails(artistID);
          return {
            ...song,
            artist: artistDetails,
          };
        })
      );

      setTopSongs(topSongsWithDetails);
    } catch (error) {
      console.error('Error fetching top songs:', error);
    }
  };

  useEffect(() => {
    const fetchArtistDetails = async () => {
      const details = await Promise.all(
        recommendedArtists.map(async (artist) => {
          const artistDetails = await getArtistDetails(artist.id);
          return artistDetails;
        })
      );

      setArtistDetails(details);
    };

    fetchArtistDetails();
  }, [recommendedArtists]);

  useEffect(() => {
    fetchTopSongs();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchArtist();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const topSongsElement = document.querySelector('.TopSongs');
      if (topSongsElement) {
        const topSongsPosition = topSongsElement.getBoundingClientRect();
        const isVisible = topSongsPosition.top < window.innerHeight;
        if (isVisible && !fadeTopSongs) {
          setFadeTopSongs(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [fadeTopSongs]);

  return (
    <>
      <div className='Opening'>
        <h1>Suggestify</h1>
        <h3 className='Suggest-Para'>Let's suggest you some music.</h3>
        <h4 className='Below-Sugg'>But first, let's see what you've been listening to.</h4>
        <div className="arrow-container">
          <div className="arrow"></div>
        </div>
      </div>
      <div className='BelowOpen'>
        <div className={`TopSongs ${fadeTopSongs ? 'fade-in' : ''}`}>
          <h2 className='TopPara'>Top Recent Tracks:</h2>
          <ul className="SongList">
            {topSongs.map((song, index) => {
              const artist = song.artist;
              return (
                <li key={song.id}>
                  <div>{song.name}</div>
                  <div className="ArtistInfo">
                    {artist && artist.images && artist.images.length > 0 ? (
                      <LazyLoad once>
                        <img
                          src={artist.images[2].url} 
                          alt={artist.name}
                          className="ProfileImage"
                        />
                      </LazyLoad>
                    ) : null}
                    <div className="ArtistName">{artist ? artist.name : ''}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <h3 className='BelowFirstArt'>Let's see what you should listen to next.</h3>
          <h3 className='BelowFirstArt1'>Use the search bar below to search for an artist, and we'll give you good recommendations.</h3>
        </div>
        <div className='EverythingElse'>
          <h2 className='Recs'>Recommendations </h2>
          <div className="SearchForm">
            <input
              className="Name"
              type="text"
              placeholder="Search By Artist Name..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={searchArtist}>Search</button>
          </div>
          <h3>Recommended Artists:</h3>

          <div className="RecommendedArtists">
  {recommendedArtists.map((artist, index) => {
    const artistDetail = artistDetails[index];
    if (artistDetail) {
      return (
        <div className="ArtistItem1" key={artist.id}>
          {artistDetail.images && artistDetail.images.length > 0 ? (
            <LazyLoad once>
              <img
                src={artistDetail.images[0].url} 
                alt={artistDetail.name}
                className="ProfileImage1"
              />
            </LazyLoad>
          ) : null}
          <div className="ArtistName1">{artistDetail.name}</div>
        </div>
      );
    } else {
      return (
        <div className="ArtistItem1" key={artist.id}>
          <div className="ArtistName1">{artist.name}</div>
        </div>
      );
    }
  })}
</div>
    <h3>Recommended Albums:</h3>

    <div className="RecommendedAlbums">
  {recommendedAlbums.map((album) => {
    const albumArtist = album.artists[0];
    return (
      <div className="AlbumItem" key={album.id}>
        {album.images && album.images.length > 0 ? (
          <LazyLoad once>
            <img
              src={album.images[0].url} 
              alt={album.name}
              className="AlbumCover"
            />
          </LazyLoad>
        ) : null}
        <div className="AlbumName">{album.name}</div>
        <div className="ArtistName2">{albumArtist.name}</div>
      </div>
    );
  })}
</div>

        </div>
      </div>
    </>
  );
}

export default Suggest;
