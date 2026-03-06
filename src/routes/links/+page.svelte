<script lang="ts">
  const links = [
    {
      title: 'GitHub',
      url: 'https://github.com/izmaelmag',
      description: 'Open source projects'
    },
    {
      title: 'Telegram',
      url: 'https://t.me/izmaelmag',
      description: 'Personal channel'
    },
    {
      title: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ismail-magomedov/',
      description: 'Professional profile'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/izmaelmag',
      description: 'Thoughts & updates'
    }
  ];
</script>

<div class="links-page">
  <header>
    <h1>Links</h1>
  </header>

  <ul class="links-list">
    {#each links as link}
      <li>
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          <span class="link-title">{link.title}</span>
          <span class="link-description">{link.description}</span>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .links-page {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    box-sizing: border-box;
  }

  header {
    margin-bottom: 24px;
    text-align: center;
  }

  h1 {
    font-size: 20px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #fff;
  }

  .links-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }

  .links-list li a {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
    padding: 14px 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    text-decoration: none;
    color: #fff;
    transition: all 0.2s ease;
  }

  .links-list li a:hover {
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .link-title {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
  }

  .link-description {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }

  @media (min-width: 480px) {
    .links-page {
      padding: 48px 24px;
    }

    h1 {
      font-size: 24px;
    }

    .links-list {
      max-width: 400px;
      gap: 14px;
    }

    .links-list li a {
      padding: 16px 20px;
    }
  }
</style>
