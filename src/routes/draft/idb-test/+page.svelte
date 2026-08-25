<script lang="ts">
  import { liveQuery } from 'dexie';
  import { db } from './db';

  const users = liveQuery(() => db.users.toArray());

  const deleteUser = async (id?: number) => {
    if (!id) return;

    try {
      await db.users.delete(id);
    } catch (e) {
      console.warn(e);
    }
  };

  const addUser = async (e: SubmitEvent) => {
    try {
      const formElement = e.currentTarget as HTMLFormElement | null;

      if (!formElement) throw new Error('Form element is null');

      const formData = new FormData(formElement);

      const name = formData.get('name')?.toString();
      const surname = formData.get('surname')?.toString();
      const age = Number(formData.get('age'));

      if (!name || !surname || !age) throw new Error('Empty fields');

      await db.users.add({
        name,
        surname,
        age
      });

      formElement.reset();
    } catch (error) {
      console.warn('Failed to add user');
      console.warn(error);
    }
  };
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Dexie db test" />
</svelte:head>

<form
  class="form"
  onsubmit={(e) => {
    e.preventDefault();
    addUser(e);
  }}
>
  <input name="name" placeholder="Name" value="" type="text" />
  <input name="surname" placeholder="Surname" value="" type="text" />
  <input name="age" placeholder="age" value="" type="number" />
  <button>Add user</button>
</form>

{#if $users}
  {#each $users as user (user.id)}
    <div class="line">
      <h3>{user.name} {user.surname}, {user.age}y.o.</h3>
      <button type="button" onclick={() => deleteUser(user.id)}>Delete</button>
    </div>
  {/each}
{/if}

<style>
  .line {
    margin: 10px 0 0;
    display: flex;
    gap: 10px;
  }

  .form {
    margin: 10px 0;
  }
</style>
